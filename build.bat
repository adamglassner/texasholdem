@echo off
rem Builds TexasHoldem.exe and, if Inno Setup 6.3+ is installed, the setup.
rem Needs Go 1.24+ (winget install GoLang.Go).
setlocal EnableDelayedExpansion
cd /d "%~dp0"

where go >nul 2>nul || (echo Go is not installed. Run: winget install GoLang.Go & pause & exit /b 1)

for /f "tokens=2 delims=[]" %%v in ('findstr /b /c:"## [" web\CHANGELOG.md') do if not defined VERSION set VERSION=%%v
echo Building Texas Hold'em %VERSION% ...

set OUT=%~dp0dist\Games\TexasHoldem
set B=%~dp0build
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
mkdir "%OUT%" "%B%\app" || exit /b 1

pushd tools\mkres
go mod tidy || exit /b 1
go build -o "%B%\mkres.exe" . || exit /b 1
popd

copy /y shell\*.go "%B%\app\" >nul
xcopy /e /i /q web "%B%\app\web" >nul
(echo module ironite/holdem& echo.& echo go 1.24)> "%B%\app\go.mod"
"%B%\mkres.exe" -version %VERSION% -icon icon-1024.png -out "%B%\app\rsrc_windows_amd64.syso" -name "Texas Hold'em" -exe TexasHoldem.exe -internal TexasHoldem -identity Ironite.TexasHoldem -desc "Texas Hold'em - Pecos Creek Saloon" || exit /b 1

pushd "%B%\app"
set GOOS=windows& set GOARCH=amd64& set CGO_ENABLED=0
go build -trimpath -ldflags "-H windowsgui -s -w -X main.gameID=TexasHoldem -X \"main.title=Texas Hold'em\" -X main.version=%VERSION%" -o "%OUT%\TexasHoldem.exe" . || exit /b 1
popd

copy /y web\CHANGELOG.md "%OUT%\CHANGELOG.txt" >nul
copy /y web\fonts\OFL.txt "%OUT%\OFL.txt" >nul
powershell -NoProfile -Command "foreach($f in 'README','CREDITS'){ (Get-Content \"$f.txt\") -replace '@VERSION@','%VERSION%' | Set-Content \"$env:OUT\$f.txt\" }"
(echo %VERSION%)> "%OUT%\VERSION"
rmdir /s /q build
echo Built %OUT%\TexasHoldem.exe

set ISCC=
for %%p in ("%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" "%ProgramFiles%\Inno Setup 6\ISCC.exe" "%LocalAppData%\Programs\Inno Setup 6\ISCC.exe") do if exist %%p set ISCC=%%p
if defined ISCC (
  pushd installer
  !ISCC! TexasHoldemSetup.iss || exit /b 1
  popd
  echo Setup: %~dp0Output\TexasHoldem-Setup-v%VERSION%.exe
) else (
  echo Inno Setup 6 not found, skipped the setup. Install it with: winget install JRSoftware.InnoSetup
)
pause
