VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} FormImport 
   Caption         =   "Import Century/Daycent Output Data"
   ClientHeight    =   2490
   ClientLeft      =   45
   ClientTop       =   375
   ClientWidth     =   6735
   OleObjectBlob   =   "FormImport.frx":0000
   ShowModal       =   0   'False
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "FormImport"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub UserForm_Initialize()
    ModuleImport.Init
    TextBoxDir.Text = ModuleImport.LastDir
    TextBoxLis.Text = ModuleImport.LastLis

End Sub

Private Sub ButtonBrowseDir_Click()
    Dim fd As FileDialog
    Set fd = Application.FileDialog(msoFileDialogFolderPicker)
    With fd
        .Title = "Select a Folder"
        .AllowMultiSelect = False
        .InitialFileName = ""
        .Filters.Clear
        If .Show Then
            TextBoxDir.Text = fd.SelectedItems(1)
        End If
    End With
    Set fd = Nothing
End Sub

Private Sub ButtonBrowseLis_Click()
    Dim fd As FileDialog
    Set fd = Application.FileDialog(msoFileDialogFilePicker)
    With fd
        .Title = "Select LIS File"
        .AllowMultiSelect = False
        Dim FileName, lisname As String
        FileName = """" & TextBoxDir.Text & "\*.lis"""
        .InitialFileName = FileName
        .Filters.Clear
        .Filters.Add "Daycent/Century Output Data", "*.lis"
        If .Show Then
            lisname = Dir(fd.SelectedItems(1))
            TextBoxLis.Text = Left(lisname, Len(lisname) - 4)
        End If
    End With
    Set fd = Nothing

End Sub

Private Sub ButtonImport_Click()
    ModuleImport.LastDir = TextBoxDir.Text
    ModuleImport.LastLis = TextBoxLis.Text
    ModuleImport.ImportData
    'Unload Me
End Sub


