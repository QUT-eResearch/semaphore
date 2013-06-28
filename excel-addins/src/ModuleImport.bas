Attribute VB_Name = "ModuleImport"
'Public CenturyFiles
Public DaycentFiles
Public LastModel As String
Public LastDir As String
Public LastLis As String
Public LastModelDocProp As DocumentProperty
Public LastDirDocProp As DocumentProperty
Public LastLisDocProp As DocumentProperty

Sub Init()
    On Error Resume Next
    Set LastModelDocProp = ActiveWorkbook.CustomDocumentProperties("ModelName")
    Set LastDirDocProp = ActiveWorkbook.CustomDocumentProperties("ModelOutputDirectory")
    Set LastLisDocProp = ActiveWorkbook.CustomDocumentProperties("LisOutputName")
    If Err.Number > 0 Then
        LastModel = "century"
        LastDir = ""
        LastLis = ""
        ActiveWorkbook.CustomDocumentProperties.Add Name:="ModelName", LinkToContent:=False, Type:=msoPropertyTypeString, Value:=LastModel
        ActiveWorkbook.CustomDocumentProperties.Add Name:="ModelOutputDirectory", LinkToContent:=False, Type:=msoPropertyTypeString, Value:=LastDir
        ActiveWorkbook.CustomDocumentProperties.Add Name:="LisOutputName", LinkToContent:=False, Type:=msoPropertyTypeString, Value:=LastLis
        Set LastModelDocProp = ActiveWorkbook.CustomDocumentProperties("ModelName")
        Set LastDirDocProp = ActiveWorkbook.CustomDocumentProperties("ModelOutputDirectory")
        Set LastLisDocProp = ActiveWorkbook.CustomDocumentProperties("LisOutputName")
    Else
        LastModel = LastModelDocProp.Value
        LastDir = LastDirDocProp.Value
        LastLis = LastLisDocProp.Value
    End If
        
    'CenturyFiles = Array("A", "B")
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

Sub RibbonUpdateButton(ByVal control As IRibbonControl)
    ImportData
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
    LisFilePath = LastDir & "\" & LastLis & ".lis"

    ImportFileToSheet LisFilePath, wb, ".lis"

    If LastModel = "daycent" Then
        'Debug.Print "daycent"
        Dim FName As String
        For Each fn In DaycentFiles
            FName = CStr(fn)
            Dim DaycentFilePath As String
            DaycentFilePath = FormImport.TextBoxDir & "\" & FName

            ImportFileToSheet DaycentFilePath, wb, FName

        Next fn
    End If
    
    LastModelDocProp.Value = LastModel
    LastDirDocProp.Value = LastDir
    LastLisDocProp.Value = LastLis
    
End Sub
