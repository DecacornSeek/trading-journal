param(
    [string]$WorkbookPath = 'C:\Users\ericl\OneDrive\Trading Journal.xlsm',
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'

function Get-LearningParts([string]$text) {
    $clean = ($text -replace '^\s*\d+\.\s*', '').Trim()
    if ($clean -match '^([^:]{2,80}):\s*(.+)$') {
        return @{ Title = $matches[1].Trim(); Description = $matches[2].Trim() }
    }
    $singleLine = ($clean -replace '\s+', ' ').Trim()
    $title = if ($singleLine.Length -le 82) { $singleLine } else { $singleLine.Substring(0, 79).TrimEnd() + '...' }
    return @{ Title = $title; Description = $clean }
}

if (-not (Test-Path $WorkbookPath)) { throw "Workbook not found: $WorkbookPath" }
$outputPath = Join-Path $ProjectRoot 'src\data\excelLearnings.json'
$sourceHash = (Get-FileHash $WorkbookPath -Algorithm SHA256).Hash.ToLowerInvariant()
$sourceDate = (Get-Item $WorkbookPath).LastWriteTime.ToString('yyyy-MM-dd')

$sections = @(
    @{ Category = 'Key Lessons'; Rows = 7..13 },
    @{ Category = 'Entry Model'; Rows = 16..22 },
    @{ Category = 'Stop Loss'; Rows = 26..27 },
    @{ Category = 'Psychology'; Rows = 31..36 }
)

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AutomationSecurity = 3
try {
    $book = $excel.Workbooks.Open($WorkbookPath, 0, $true)
    $sheet = $book.Worksheets.Item('Learnings')
    $learnings = @()
    $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

    foreach ($section in $sections) {
        foreach ($row in $section.Rows) {
            $cell = $sheet.Cells.Item($row, 2)
            $text = "$($cell.Text)".Trim()
            [Runtime.InteropServices.Marshal]::ReleaseComObject($cell) | Out-Null
            if (-not $text) { continue }
            $parts = Get-LearningParts $text
            $key = ($parts.Title + '|' + $parts.Description) -replace '\s+', ' '
            if (-not $seen.Add($key)) { continue }
            $learnings += [ordered]@{
                id = "excel-learning-b$row"
                date = $sourceDate
                title = $parts.Title
                description = $parts.Description
                category = $section.Category
                source = 'Trading Journal.xlsm - Learnings'
                source_cell = "B$row"
            }
        }
    }

    $sessionPairs = @()
    foreach ($row in 42..48) {
        $left = $sheet.Cells.Item($row, 7)
        $right = $sheet.Cells.Item($row, 8)
        $behavior = "$($left.Text)".Trim()
        $session = "$($right.Text)".Trim()
        [Runtime.InteropServices.Marshal]::ReleaseComObject($left) | Out-Null
        [Runtime.InteropServices.Marshal]::ReleaseComObject($right) | Out-Null
        if (-not $behavior -or -not $session) { continue }
        $key = "$behavior|$session"
        if ($sessionPairs -contains $key) { continue }
        $sessionPairs += $key
        $learnings += [ordered]@{
            id = "excel-learning-session-$row"
            date = $sourceDate
            title = "$behavior - $session session"
            description = "Workbook session observation: $behavior was associated with the $session session. Treat this as a hypothesis to validate against labeled trades, not a universal market rule."
            category = 'Session Patterns'
            source = 'Trading Journal.xlsm - Learnings'
            source_cell = "G$row`:H$row"
        }
    }

    $utf8 = [Text.UTF8Encoding]::new($false)
    [IO.File]::WriteAllText($outputPath, ($learnings | ConvertTo-Json -Depth 5), $utf8)
    Write-Output "IMPORTED_LEARNINGS=$($learnings.Count)"
    Write-Output "CURATED_B_LEARNINGS=$(($learnings | Where-Object { $_.source_cell -like 'B*' }).Count)"
    Write-Output "SESSION_OBSERVATIONS=$(($learnings | Where-Object { $_.source_cell -like 'G*' }).Count)"
    Write-Output "WORKBOOK_SHA256=$sourceHash"

    $book.Close($false)
    [Runtime.InteropServices.Marshal]::ReleaseComObject($sheet) | Out-Null
    [Runtime.InteropServices.Marshal]::ReleaseComObject($book) | Out-Null
}
finally {
    $excel.Quit()
    [Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}