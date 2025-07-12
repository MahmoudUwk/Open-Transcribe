; Open-Transcribe Installer Script
; Generated for Open-Transcribe v1.1

[Setup]
; Unique application identifier
AppId={{012806BC-F9A7-4F93-9406-3FDA375AFAA3}} 
AppName=Open-Transcribe
AppVersion=1.1
AppVerName=Open-Transcribe 1.1
AppPublisher=Mahmoud Sallam
AppPublisherURL=https://www.linkedin.com/in/mahmoudsallam7/
AppSupportURL=https://github.com/your-repo/open-transcribe
AppUpdatesURL=https://github.com/your-repo/open-transcribe/releases
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
; Main executable and dependencies
Source: "dist\OpenTranscribe.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Documentation files
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Start menu shortcut
Name: "{autoprograms}\Open-Transcribe"; Filename: "{app}\OpenTranscribe.exe"; Comment: "AI-Powered Audio Transcription"
; Desktop shortcut (optional)
Name: "{autodesktop}\Open-Transcribe"; Filename: "{app}\OpenTranscribe.exe"; Comment: "AI-Powered Audio Transcription"; Tasks: desktopicon

[Run]
; Option to launch after installation
Filename: "{app}\OpenTranscribe.exe"; Description: "Launch Open-Transcribe"; Flags: nowait postinstall skipifsilent

[Tasks]
; Optional desktop icon
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: unchecked

[UninstallDelete]
; Clean up config files on uninstall
Type: filesandordirs; Name: "{userappdata}\OpenTranscribe"

