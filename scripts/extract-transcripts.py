#!/usr/bin/env python3
"""
YouTube Transcript Extractor using yt-dlp
Extracts subtitles/captions from YouTube videos with fallback options
"""

import yt_dlp
import json
import sys
import os
import re
from typing import Dict, List, Optional, Any
from pathlib import Path

class YouTubeTranscriptExtractor:
    def __init__(self, temp_dir: str = "temp"):
        """Initialize the extractor with temporary directory for downloads"""
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(exist_ok=True)
        
        # Configure yt-dlp options for subtitle extraction
        self.subtitle_opts = {
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitlesformat': 'json3',
            'quiet': True,
            'no_warnings': True,
        }
        
        # Configure yt-dlp options for audio download (fallback)
        self.audio_opts = {
            'format': 'bestaudio/best',
            'outtmpl': str(self.temp_dir / '%(id)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
        }
    
    def extract_transcript(self, video_id: str) -> Dict[str, Any]:
        """
        Extract transcript for a YouTube video
        
        Args:
            video_id: YouTube video ID
            
        Returns:
            Dict containing transcript data and metadata
        """
        url = f"https://youtube.com/watch?v={video_id}"
        
        try:
            # First, try to extract subtitles without downloading
            return self._extract_subtitles(url, video_id)
        except Exception as e:
            print(f"Subtitle extraction failed for {video_id}: {str(e)}", file=sys.stderr)
            return {
                'video_id': video_id,
                'success': False,
                'error': str(e),
                'transcript': None,
                'method': 'failed',
                'duration': None,
                'title': None
            }
    
    def _extract_subtitles(self, url: str, video_id: str) -> Dict[str, Any]:
        """Extract subtitles using yt-dlp"""
        
        with yt_dlp.YoutubeDL(self.subtitle_opts) as ydl:
            try:
                # Get video info
                info = ydl.extract_info(url, download=False)
                
                title = info.get('title', 'Unknown Title')
                duration = info.get('duration', 0)
                
                # Check for subtitles
                subtitles = info.get('subtitles', {})
                automatic_captions = info.get('automatic_captions', {})
                
                # Prefer manual subtitles, fallback to automatic
                available_subs = subtitles if subtitles else automatic_captions
                
                if not available_subs:
                    raise Exception("No subtitles or automatic captions available")
                
                # Try to get English subtitles first
                lang_priorities = ['en', 'en-US', 'en-GB']
                subtitle_data = None
                used_lang = None
                
                for lang in lang_priorities:
                    if lang in available_subs:
                        subtitle_data = available_subs[lang]
                        used_lang = lang
                        break
                
                # If no English, take the first available
                if not subtitle_data:
                    lang_list = list(available_subs.keys())
                    if lang_list:
                        used_lang = lang_list[0]
                        subtitle_data = available_subs[used_lang]
                
                if not subtitle_data:
                    raise Exception("No subtitle data found")
                
                # Get the subtitle URL (prefer json3 format)
                subtitle_url = None
                for sub_format in subtitle_data:
                    if sub_format.get('ext') == 'json3':
                        subtitle_url = sub_format.get('url')
                        break
                
                # Fallback to any available format
                if not subtitle_url and subtitle_data:
                    subtitle_url = subtitle_data[0].get('url')
                
                if not subtitle_url:
                    raise Exception("No subtitle URL found")
                
                # Download and parse the subtitles
                transcript_text = self._download_and_parse_subtitles(subtitle_url, video_id)
                
                return {
                    'video_id': video_id,
                    'success': True,
                    'transcript': transcript_text,
                    'method': 'yt-dlp-subtitles',
                    'language': used_lang,
                    'duration': duration,
                    'title': title,
                    'error': None
                }
                
            except Exception as e:
                raise Exception(f"Subtitle extraction failed: {str(e)}")
    
    def _download_and_parse_subtitles(self, subtitle_url: str, video_id: str) -> str:
        """Download and parse subtitle content from URL"""
        import urllib.request
        import urllib.error
        
        try:
            # Download subtitle data
            with urllib.request.urlopen(subtitle_url) as response:
                subtitle_data = json.loads(response.read().decode('utf-8'))
            
            # Parse subtitle events
            transcript_parts = []
            
            if 'events' in subtitle_data:
                for event in subtitle_data['events']:
                    if 'segs' in event:
                        # Extract text from segments
                        text_parts = []
                        for seg in event['segs']:
                            if 'utf8' in seg:
                                text_parts.append(seg['utf8'])
                        
                        if text_parts:
                            text = ''.join(text_parts).strip()
                            if text and text != '\n':
                                transcript_parts.append(text)
            
            # Join all parts
            transcript = ' '.join(transcript_parts)
            
            # Clean up the transcript
            transcript = self._clean_transcript(transcript)
            
            return transcript
            
        except Exception as e:
            raise Exception(f"Failed to parse subtitles: {str(e)}")
    
    def _clean_transcript(self, transcript: str) -> str:
        """Clean and normalize transcript text"""
        if not transcript:
            return ""
        
        # Remove multiple whitespaces and newlines
        transcript = re.sub(r'\s+', ' ', transcript)
        
        # Remove common YouTube artifacts
        transcript = re.sub(r'\[Music\]', '', transcript)
        transcript = re.sub(r'\[Applause\]', '', transcript)
        transcript = re.sub(r'\[Laughter\]', '', transcript)
        transcript = re.sub(r'\[.*?\]', '', transcript)  # Remove any [bracketed] content
        
        # Clean up punctuation
        transcript = re.sub(r'\s+([,.!?;:])', r'\1', transcript)
        transcript = re.sub(r'([.!?])\s*([a-z])', r'\1 \2', transcript)
        
        return transcript.strip()

def main():
    """Main function for command line usage"""
    if len(sys.argv) != 2:
        print("Usage: python extract-transcripts.py <video_id>")
        sys.exit(1)
    
    video_id = sys.argv[1].strip()
    
    # Remove any URL parts if full URL was provided
    if '=' in video_id:
        video_id = video_id.split('=')[-1]
    if '/' in video_id:
        video_id = video_id.split('/')[-1]
    
    extractor = YouTubeTranscriptExtractor()
    result = extractor.extract_transcript(video_id)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()