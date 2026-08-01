import os
import sys
import urllib.parse
import urllib.request
import subprocess
import logging

logger = logging.getLogger("TTSService")

class TTSService:
    """TTS Service to speak text out loud using natural Vietnamese AI voice."""

    def __init__(self):
        # Create storage folder if not exists
        self.output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../robot_data"))
        os.makedirs(self.output_dir, exist_ok=True)
        self.mp3_path = os.path.join(self.output_dir, "speak.mp3")

    def speak(self, text: str):
        """Generate and play audio for the given text."""
        if not text or not text.strip():
            return False

        logger.info(f"Speaking: '{text}'")

        # 1. Generate MP3 using Google TTS (Natural Vietnamese Accent)
        try:
            encoded_text = urllib.parse.quote(text)
            url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q={encoded_text}"
            
            headers = {'User-Agent': 'Mozilla/5.0'}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as response:
                with open(self.mp3_path, 'wb') as f:
                    f.write(response.read())
            
            logger.info("Successfully downloaded natural speech MP3 file.")
        except Exception as e:
            logger.error(f"Failed to generate TTS MP3: {e}")
            return self._fallback_speak(text)

        # 2. Play audio file on Pi (Linux) or Dev PC (Windows)
        return self._play_audio(self.mp3_path, text)

    def _play_audio(self, file_path: str, fallback_text: str) -> bool:
        if sys.platform == "win32":
            # Play on Windows Dev PC using Windows Media Player COM Object via PowerShell
            try:
                cmd = f'powershell -c "$play = New-Object -ComObject WMPlayer.OCX.7; $play.URL = \'{file_path}\'; $play.controls.play(); while($play.playState -ne 1) {{ Start-Sleep -Milliseconds 100 }}"'
                subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return True
            except Exception as e:
                logger.error(f"Failed to play audio on Windows: {e}")
                return False
        else:
            # Play on Raspberry Pi Linux
            players = ["mpg123", "mpv", "play", "aplay", "cvlc"]
            played = False
            for player in players:
                try:
                    # Check if player exists by running with dummy arg or checking status
                    # Using Popen to play asynchronously without blocking the REST API response
                    if player == "mpg123":
                        subprocess.Popen([player, "-q", file_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    else:
                        subprocess.Popen([player, file_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    played = True
                    logger.info(f"Playing audio using {player}")
                    break
                except FileNotFoundError:
                    continue
                except Exception as e:
                    logger.error(f"Error playing with {player}: {e}")
                    
            if not played:
                logger.warning("No command-line audio player found on Linux. Falling back to local espeak.")
                return self._fallback_speak(fallback_text)
            return True

    def _fallback_speak(self, text: str) -> bool:
        """Fallback to local espeak-ng if offline or player fails."""
        if sys.platform == "win32":
            return False
        try:
            cmd = f'espeak-ng -v vi "{text}" 2>/dev/null'
            subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except Exception:
            return False

# Singleton instance
tts_service = TTSService()
