Attribute VB_Name = "ModuleImport"
Public CenturyFiles
Public DaycentFiles
Public LastDir As String
Public LastLis As String

Sub Init()
    LastDir = ""
    LastLis = ""
    CenturyFiles = Array("A", "B")
    DaycentFiles = Array("bio.out", "soiln.out", "soiltavg.out", "soiltmax.out", _
        "soiltmin.out", "stemp_dx.out", "vswc.out", "watrbal.out", "wfps.out", _
        "co2.out", "wflux.out", "mresp.out", "year_summary.out", _
        "livec.out", "deadc.out", "soilc.out", "sysc.out", "tgmonth.out", _
        "dN2lyr.out", "dN2Olyr.out", "gresp.out", "dels.out", "dc_sip.csv", "harvest.csv", _
        "cflows.out", "year_cflows.out", "daily.out", "nflux.out", "summary.out")
End Sub

Sub RibbonImportButton(ByVal control As IRibbonControl)
'
' ImportCenturyDaycentOutputData Macro
' Import Century / Daycent output data to Excel worksheets
'
    FormImport.Show
End Sub

Function SheetExists(SheetsObject As Sheets, Sheetname As String) As Boolean
    SheetExists = False
    For Each ws In SheetsObject
        If Sheetname = ws.Name Then
            SheetExists = True
            Exit For
        End If
    Next
End Function

Sub ImportFileToSheet(FilePath As String, ByRef DestWb As Workbook, Sheetname As String)
    Dim wbtemp As Workbook
    Dim ws As Worksheet
    Dim FName As String
    FName = Dir(FilePath)
    If (FName <> "") Then
        Dim Ext As String
        Ext = LCase(Mid(FName, InStrRev(FName, ".") + 1))
        If Ext = "csv" Then
            Workbooks.OpenText FileName:=FilePath, DataType:=xlDelimited, ConsecutiveDelimiter:=False, Comma:=True
        ElseIf (Ext = "lis" Or Ext = "out") Then
            Workbooks.OpenText FileName:=FilePath, DataType:=xlDelimited, ConsecutiveDelimiter:=True, Space:=True, Tab:=True
        Else
            Workbooks.OpenText FileName:=FilePath
        End If
        
        Set wbtemp = ActiveWorkbook
        If SheetExists(DestWb.Sheets, Sheetname) Then
            Set ws = DestWb.Sheets(Sheetname)
        Else
            Set ws = DestWb.Sheets.Add
            ws.Name = Sheetname
        End If
        
        If WorksheetFunction.CountA(wbtemp.Sheets(1).Columns(1)) = 0 Then
            wbtemp.Sheets(1).Columns(1).Delete
        End If
        wbtemp.Sheets(1).Cells.Copy ws.Cells
        wbtemp.Close SaveChanges:=False
    End If

End Sub

Sub ImportData()
    Dim wb As Workbook
    Set wb = ActiveWorkbook

    Dim LisFilePath As String
    LisFilePath = FormImport.TextBoxDir & "\" & FormImport.TextBoxLis & ".lis"

    ImportFileToSheet LisFilePath, wb, ".lis"

    If FormImport.OptionDaycent.Value Then
        'Debug.Print "daycent"
        Dim FName As String
        For Each fn In DaycentFiles
            FName = CStr(fn)
            Dim DaycentFilePath As String
            DaycentFilePath = FormImport.TextBoxDir & "\" & FName

            ImportFileToSheet DaycentFilePath, wb, FName

        Next fn
    End If
End Sub
