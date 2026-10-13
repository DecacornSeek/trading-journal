param(
    [string]$WorkbookPath = 'C:\Users\ericl\OneDrive\Trading Journal.xlsm',
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-ZipXml($zip, [string]$entryName) {
    $entry = $zip.GetEntry($entryName)
    if (-not $entry) { throw "Workbook entry not found: $entryName" }
    $reader = [IO.StreamReader]::new($entry.Open())
    try {
        $document = [xml]$reader.ReadToEnd()
        return $document
    }
    finally {
        $reader.Dispose()
    }
}

function Get-CellImageMap($zip, [string]$sheetPath) {
    $sheetXml = Read-ZipXml $zip $sheetPath
    $metadataXml = Read-ZipXml $zip 'xl/metadata.xml'
    $richValueXml = Read-ZipXml $zip 'xl/richData/rdrichvalue.xml'
    $richRelXml = Read-ZipXml $zip 'xl/richData/richValueRel.xml'
    $relationshipXml = Read-ZipXml $zip 'xl/richData/_rels/richValueRel.xml.rels'

    $sheetNs = [Xml.XmlNamespaceManager]::new($sheetXml.NameTable)
    $sheetNs.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $metadataNs = [Xml.XmlNamespaceManager]::new($metadataXml.NameTable)
    $metadataNs.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $metadataNs.AddNamespace('xlrd', 'http://schemas.microsoft.com/office/spreadsheetml/2017/richdata')
    $richNs = [Xml.XmlNamespaceManager]::new($richValueXml.NameTable)
    $richNs.AddNamespace('rd', 'http://schemas.microsoft.com/office/spreadsheetml/2017/richdata')
    $richRelNs = [Xml.XmlNamespaceManager]::new($richRelXml.NameTable)
    $richRelNs.AddNamespace('rr', 'http://schemas.microsoft.com/office/spreadsheetml/2022/richvaluerel')
    $richRelNs.AddNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $relationshipNs = [Xml.XmlNamespaceManager]::new($relationshipXml.NameTable)
    $relationshipNs.AddNamespace('r', 'http://schemas.openxmlformats.org/package/2006/relationships')

    $metadataBlocks = @($metadataXml.SelectNodes('//x:futureMetadata[@name="XLRICHVALUE"]/x:bk', $metadataNs))
    $richValues = @($richValueXml.SelectNodes('//rd:rv', $richNs))
    $richRelations = @($richRelXml.SelectNodes('//rr:rel', $richRelNs))
    $relationshipTargets = @{}
    foreach ($relationship in $relationshipXml.SelectNodes('//r:Relationship', $relationshipNs)) {
        $relationshipTargets[$relationship.Id] = $relationship.Target
    }

    $map = @{}
    foreach ($cell in $sheetXml.SelectNodes('//x:c[@vm]', $sheetNs)) {
        if ($cell.r -notmatch '^[DEF]\d+$') { continue }
        $metadataIndex = [int]$cell.vm - 1
        if ($metadataIndex -lt 0 -or $metadataIndex -ge $metadataBlocks.Count) { continue }
        $richIndex = [int]$metadataBlocks[$metadataIndex].SelectSingleNode('.//xlrd:rvb', $metadataNs).i
        $relationIndex = [int]$richValues[$richIndex].SelectNodes('./rd:v', $richNs)[0].InnerText
        $relationshipId = $richRelations[$relationIndex].GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
        $target = $relationshipTargets[$relationshipId]
        if (-not $target) { continue }
        $map[$cell.r] = 'xl/' + ($target -replace '^\.\./', '')
    }
    return $map
}

function Convert-ExcelDate($value) {
    if ($null -eq $value -or "$value".Trim() -eq '') { return $null }
    if ($value -is [double] -or $value -is [int] -or $value -is [decimal]) {
        return [DateTime]::FromOADate([double]$value)
    }
    $parsed = [DateTime]::MinValue
    foreach ($cultureName in 'en-AU', 'en-US', '') {
        $culture = if ($cultureName) { [Globalization.CultureInfo]::GetCultureInfo($cultureName) } else { [Globalization.CultureInfo]::InvariantCulture }
        if ([DateTime]::TryParse("$value", $culture, [Globalization.DateTimeStyles]::AllowWhiteSpaces, [ref]$parsed)) {
            return $parsed
        }
    }
    return $null
}

function Convert-Number($value) {
    if ($null -eq $value -or "$value".Trim() -eq '') { return $null }
    if ($value -is [double] -or $value -is [int] -or $value -is [decimal]) { return [double]$value }
    $normalized = "$value" -replace ',', '.'
    $number = 0.0
    if ([double]::TryParse($normalized, [Globalization.NumberStyles]::Float, [Globalization.CultureInfo]::InvariantCulture, [ref]$number)) {
        return $number
    }
    return $null
}

function Convert-Timeframe($value) {
    $text = "$value".Trim()
    if (-not $text) { return '' }
    if ($text -match '^(\d+)\s*[\x27\x22]?$') { return "$($matches[1])m" }
    return $text
}

function Convert-Direction($value) {
    $text = "$value".Trim().ToLowerInvariant()
    if ($text -eq 'long' -or $text -eq 'short') { return $text }
    return ''
}

function Convert-Result($value) {
    $text = "$value".Trim().ToLowerInvariant()
    if ($text -eq 'win') { return 'win' }
    if ($text -eq 'loss') { return 'loss' }
    return $null
}

function New-Screenshot($cellAddress, $imageMap, $outputDirectory, $zip, $phase) {
    if (-not $imageMap.ContainsKey($cellAddress)) { return @() }
    $entryPath = $imageMap[$cellAddress]
    $entry = $zip.GetEntry($entryPath)
    if (-not $entry) { throw "Image entry not found for $cellAddress`: $entryPath" }
    $fileName = Split-Path -Leaf $entryPath
    $targetPath = Join-Path $outputDirectory $fileName
    $sourceStream = $entry.Open()
    $targetStream = [IO.File]::Create($targetPath)
    try { $sourceStream.CopyTo($targetStream) }
    finally {
        $targetStream.Dispose()
        $sourceStream.Dispose()
    }
    return @([ordered]@{
        id = "excel-real-$cellAddress"
        name = "Real Trading $cellAddress"
        dataUrl = "/workbook-images/$fileName"
        addedAt = $null
        source = 'Trading Journal.xlsm'
        phase = $phase
    })
}

if (-not (Test-Path $WorkbookPath)) { throw "Workbook not found: $WorkbookPath" }
$workbookHash = (Get-FileHash $WorkbookPath -Algorithm SHA256).Hash.ToLowerInvariant()
$imageOutput = Join-Path $ProjectRoot 'public\workbook-images'
$dataOutput = Join-Path $ProjectRoot 'src\data\workbookTrades.json'
$manifestOutput = Join-Path $ProjectRoot 'src\data\workbookImportManifest.json'
if (Test-Path $imageOutput) { Remove-Item $imageOutput -Recurse -Force }
New-Item $imageOutput -ItemType Directory -Force | Out-Null

$zip = [IO.Compression.ZipFile]::OpenRead($WorkbookPath)
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AutomationSecurity = 3
try {
    $workbookXml = Read-ZipXml $zip 'xl/workbook.xml'
    $workbookRelXml = Read-ZipXml $zip 'xl/_rels/workbook.xml.rels'
    $workbookNs = [Xml.XmlNamespaceManager]::new($workbookXml.NameTable)
    $workbookNs.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $workbookNs.AddNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $relationshipNs = [Xml.XmlNamespaceManager]::new($workbookRelXml.NameTable)
    $relationshipNs.AddNamespace('r', 'http://schemas.openxmlformats.org/package/2006/relationships')
    $sheetNode = $workbookXml.SelectSingleNode('//x:sheet[@name="Real Trading"]', $workbookNs)
    $sheetRelationshipId = $sheetNode.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $sheetTarget = $workbookRelXml.SelectSingleNode("//r:Relationship[@Id='$sheetRelationshipId']", $relationshipNs).Target
    $sheetPath = 'xl/' + $sheetTarget
    $imageMap = Get-CellImageMap $zip $sheetPath

    $book = $excel.Workbooks.Open($WorkbookPath, 0, $true)
    $sheet = $book.Worksheets.Item('Real Trading')
    $range = $sheet.Range('B4:T78')
    $values = $range.Value2
    [Runtime.InteropServices.Marshal]::ReleaseComObject($range) | Out-Null

    $trades = @()
    $excludedRows = @()
    $preImageCount = 0
    $postImageCount = 0
    for ($index = 1; $index -le 75; $index++) {
        $row = $index + 3
        $date = Convert-ExcelDate $values[$index, 2]
        $coin = "$($values[$index, 6])".Trim()
        if (-not $date -or -not $coin) {
            if ($date -or $coin) { $excludedRows += $row }
            continue
        }
        $time = Convert-ExcelDate $values[$index, 1]
        if ($time) { $date = $date.Date.Add($time.TimeOfDay) }

        $result = Convert-Result $values[$index, 11]
        $rawPnl = Convert-Number $values[$index, 12]
        $signedPnl = $null
        if ($null -ne $rawPnl -and $result) {
            $signedPnl = if ($result -eq 'loss') { -[Math]::Abs($rawPnl) } else { [Math]::Abs($rawPnl) }
        }
        $preScreenshots = @(New-Screenshot "D$row" $imageMap $imageOutput $zip 'pre')
        $postScreenshots = @(New-Screenshot "E$row" $imageMap $imageOutput $zip 'post')
        $preImageCount += $preScreenshots.Count
        $postImageCount += $postScreenshots.Count

        $trades += [ordered]@{
            id = "excel-real-row-$row"
            trade_type = 'real'
            date = $date.ToString('yyyy-MM-ddTHH:mm:ss')
            pair = $coin.ToUpperInvariant()
            direction = Convert-Direction $values[$index, 9]
            timeframe = Convert-Timeframe $values[$index, 8]
            entry_price = 0
            stop_loss = 0
            take_profit = 0
            status = if ($result) { 'closed' } else { 'unreviewed' }
            win_loss = $result
            pnl_dollars = $signedPnl
            pnl_currency = 'EUR'
            actual_rr = $null
            confidence = Convert-Number $values[$index, 13]
            discipline = $null
            pre_notes = "$($values[$index, 17])".Trim()
            post_notes = "$($values[$index, 18])".Trim()
            tags = @('Excel Import')
            session = ''
            btc_outlook = "$($values[$index, 7])".Trim()
            checklist_score = $null
            checklist_result = $null
            exit_price = $null
            exit_date = $null
            pre_emotion = ''
            post_emotion = ''
            pre_screenshots = $preScreenshots
            post_screenshots = $postScreenshots
            import_source = 'Trading Journal.xlsm - Real Trading'
            workbook_row = $row
            portfolio_risk = Convert-Number $values[$index, 10]
            duration_original = "$($values[$index, 14])".Trim()
            pivot_today = "$($values[$index, 15])".Trim()
            pivot_yesterday = "$($values[$index, 16])".Trim()
        }
    }

    $sourcePreImageCount = @($imageMap.Keys | Where-Object { $_ -match '^D\d+$' }).Count
    $sourcePostImageCount = @($imageMap.Keys | Where-Object { $_ -match '^E\d+$' }).Count
    $heatmapCount = @($imageMap.Keys | Where-Object { $_ -match '^F\d+$' }).Count
    $manifest = [ordered]@{
        source = $WorkbookPath
        sourceSha256 = $workbookHash
        sheet = 'Real Trading'
        sourceRows = '4:78'
        importedTrades = $trades.Count
        excludedRows = $excludedRows
        sourcePreImages = $sourcePreImageCount
        sourcePostImages = $sourcePostImageCount
        importedPreImages = $preImageCount
        importedPostImages = $postImageCount
        heatmapImagesNotImported = $heatmapCount
        pnlCurrency = 'EUR'
    }
    $utf8 = [Text.UTF8Encoding]::new($false)
    [IO.File]::WriteAllText($dataOutput, ($trades | ConvertTo-Json -Depth 8), $utf8)
    [IO.File]::WriteAllText($manifestOutput, ($manifest | ConvertTo-Json -Depth 5), $utf8)

    Write-Output "IMPORTED_TRADES=$($trades.Count)"
    Write-Output "SOURCE_PRE_IMAGES=$sourcePreImageCount"
    Write-Output "SOURCE_POST_IMAGES=$sourcePostImageCount"
    Write-Output "IMPORTED_PRE_IMAGES=$preImageCount"
    Write-Output "IMPORTED_POST_IMAGES=$postImageCount"
    Write-Output "HEATMAP_IMAGES_NOT_IMPORTED=$heatmapCount"
    Write-Output "EXCLUDED_ROWS=$($excludedRows -join ',')"
    Write-Output "WORKBOOK_SHA256=$workbookHash"

    $book.Close($false)
    [Runtime.InteropServices.Marshal]::ReleaseComObject($sheet) | Out-Null
    [Runtime.InteropServices.Marshal]::ReleaseComObject($book) | Out-Null
}
finally {
    $excel.Quit()
    [Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    $zip.Dispose()
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}