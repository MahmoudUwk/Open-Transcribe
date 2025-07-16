; Open-Transcribe Installer Script
; Generated for Open-Transcribe v1.2

[Setup]
; Unique application identifier
AppId={{012806BC-F9A7-4F93-9406-3FDA375AFAA3}} 
AppName=Open-Transcribe
AppVersion=1.2
AppVerName=Open-Transcribe 1.2
AppPublisher=Mahmoud Sallam
AppPublisherURL=https://www.linkedin.com/in/mahmoudsallam7/
AppSupportURL=https://github.com/MahmoudUwk/Open-Transcribe
AppUpdatesURL=https://github.com/MahmoudUwk/Open-Transcribe/releases
DefaultDirName={autopf}\Open-Transcribe
DefaultGroupName=Open-Transcribe
AllowNoIcons=yes
; Output configuration
OutputDir=..\Windows_installer
OutputBaseFilename=OpenTranscribeSetup
SetupIconFile=
Compression=lzma
SolidCompression=yes
WizardStyle=modern
; Minimum Windows version
MinVersion=10.0
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Main application directory
Source: "dist\OpenTranscribe\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Documentation files
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Start menu shortcut
Name: "{autoprograms}\Open-Transcribe"; Filename: "{app}\OpenTranscribe.exe"; Comment: "AI-Powered Audio Transcription"
; Desktop shortcut (optional)
Name: "{autodesktop}\Open-Transcribe"; Filename: "{app}\OpenTranscribe.exe"; Comment: "AI-Powered Audio Transcription"; Tasks: desktopicon
; Add uninstaller to start menu
Name: "{autoprograms}\{cm:UninstallProgram,Open-Transcribe}"; Filename: "{uninstallexe}"

[Run]
; Option to launch after installation
Filename: "{app}\OpenTranscribe.exe"; Description: "Launch Open-Transcribe"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Clean up any remaining files
Type: filesandordirs; Name: "{app}"

[Tasks]
; Optional desktop icon
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: unchecked

[UninstallDelete]
; Clean up config files on uninstall
Type: filesandordirs; Name: "{userappdata}\OpenTranscribe"

