# Product Requirements Document (PRD)

## Femtosense Voice Command Generation PoC

### 1. Introduction

### 1.1 Purpose

This document outlines the requirements for a Proof of Concept (PoC) application developed for Femtosense. The PoC aims to demonstrate the capability of generating diverse voice command variations and corresponding audio files for voice recognition training.

### 1.2 Product Overview

The PoC application will take an input Excel file containing original voice command phrases, generate multiple variations of these phrases using GPT-4o, create audio files for each variation using Femtosense's Text-to-Speech (TTS) technology, and store these audio files using the AWS ecosystem.

### 1.3 Scope

This PoC will focus on the core functionality of phrase variation generation and audio file creation. It will serve as a demonstration of AI-powered development capabilities and Femtosense's voice processing technology.

### 2. Product Features

### 2.1 Input Processing

- Accept an Excel file as input
- The first row of the Excel file will contain original phrases to be varied
- Each column represents a distinct command

### 2.2 Phrase Variation Generation

- Utilize GPT-4o API to generate 50 variations for each original phrase
    - Use the following as a basis for a prompt:
        
        *"I am an AI application developer building a product that recognizes voice commands. I am going to give you a list of commands or sentences. For each command, I want you to list [specified number of variations] you think a user might say that command to an intelligent assistant. For example, 'lights on' could turn into 'turn the lights on', "turn on the lights", 'please turn the light on', with many other variations. Try to stay within reasonable things a user might say, and limit your responses to the language that the original commands are given in."*
        
- Implement a custom prompt for GPT-4o to ensure relevant and diverse variations
- Handle multiple API calls if necessary, based on the number of input phrases

### 2.3 Output Generation

- Create a "flexible_voice_commands" file containing all original phrases and their variations
- Format the output file to maintain the column structure of the input Excel file

### 2.4 Audio File Generation

- Integrate with Femtosense's Text-to-Speech (TTS) technology, which uses the Narakeet text-to-speech API
- Generate .wav files for each phrase variation
- Ensure compatibility with Femtosense's voice processing requirements
- Support multiple voices and languages as provided by Femtosense's TTS technology

### 2.5 File Management

- Organize and save the generated .wav files in a structured folder system
- Implement AWS integration for file storage and management
- Ensure proper naming conventions for easy identification of phrase variations and corresponding audio files
 # Appendix: Integrated Files for Femtosense PoC

This appendix contains the full content of the files to be integrated into the Femtosense Voice Command Generation PoC application.

## 1. kslu_distractors.csv
 Korean,English
불이 켜져 있는 것 같아요.,It seems like the lights are on.
누가 조명 스위치를 보았어요?,Who saw the light switch?
조명이 너무 밝아요.,The lights are too bright.
지금 방에 불 필요해요?,Do we need the lights in the room now?
불이 고장 난 것 같아요.,I think the light is broken.
어두워서 조명을 켜야 할까요?,Should we turn on the lights because it's dark?
조명이 어디에 있죠?,Where are the lights?
불이 자동으로 켜지나요?,Do the lights turn on automatically?
조명 색상을 바꿀 수 있어요?,Can you change the color of the lights?
불 켜는 법을 알려 줄 수 있어요?,Can you teach me how to turn on the lights?
불이 꺼져 있는 것 같아요.,It seems like the lights are off.
불이 언제 꺼졌어요?,When were the lights turned off?
조명이 너무 어둡나요?,Are the lights too dim?
불 끄는 스위치가 어디 있죠?,Where is the switch to turn off the lights?
방에 조명이 필요 없어 보여요.,It seems we don't need lights in the room.
불이 자동으로 꺼지나요?,Do the lights turn off automatically?
지금 조명 꺼야 하나요?,Should we turn off the lights now?
조명이 너무 오래 켜져 있었어요.,The lights have been on for too long.
불 꺼는 법을 알고 싶어요.,I want to know how to turn off the lights.
화장실 불이 이미 켜져 있나요?,Are the bathroom lights already on?
화장실 조명 스위치가 어디에 있죠?,Where is the bathroom light switch?
화장실이 너무 어두워요.,The bathroom is too dark.
화장실 불이 고장 났어요?,Is the bathroom light broken?
화장실에 조명이 필요해 보여요.,It looks like we need lighting in the bathroom.
화장실에 자동 조명이 있나요?,Is there automatic lighting in the bathroom?
화장실 불 색깔을 바꿀 수 있나요?,Can we change the color of the bathroom lights?
화장실 조명을 어떻게 켜나요?,How do you turn on the bathroom lights?
화장실 조명이 눈에 좋나요?,Is the bathroom lighting good for the eyes?
화장실 불이 필요 없을 때도 있나요?,Are there times when we don't need the bathroom lights?
화장실 불이 꺼져 있어야 하나요?,Should the bathroom lights be off?
화장실 불을 꺼야 하는 이유가 있나요?,Is there a reason to turn off the bathroom lights?
화장실 조명이 너무 밝나요?,Are the bathroom lights too bright?
화장실 불을 어떻게 끄나요?,How do you turn off the bathroom lights?
화장실에 불이 필요할 때가 언제인가요?,When is it necessary to have lights in the bathroom?
화장실에 타이머 조명이 있나요?,Is there a timer light in the bathroom?
화장실 불을 줄일 수 있나요?,Can the bathroom lights be dimmed?
화장실 불이 너무 오래 켜져 있어요.,The bathroom lights have been on for too long.
화장실 조명이 자동으로 꺼지나요?,Do the bathroom lights turn off automatically?
화장실 불 끄는 스위치가 어디에 있죠?,Where is the switch to turn off the bathroom lights?
화장실에 타이머 조명이 있나요?,Is there a timer light in the bathroom?
화장실 불을 줄일 수 있나요?,Can the bathroom lights be dimmed?
화장실 불이 너무 오래 켜져 있어요.,The bathroom lights have been on for too long.
화장실 조명이 자동으로 꺼지나요?,Do the bathroom lights turn off automatically?
화장실 불 끄는 스위치가 어디에 있죠?,Where is the switch to turn off the bathroom lights?
침실 불이 이미 켜져 있나요?,Are the bedroom lights already on?
침실 조명 스위치가 어디에 있죠?,Where is the bedroom light switch?
침실이 너무 어두워요.,The bedroom is too dark.
침실 불이 고장 났어요?,Is the bedroom light broken?
침실에 조명이 필요해 보여요.,It looks like we need lighting in the bedroom.
침실에 자동 조명이 있나요?,Is there automatic lighting in the bedroom?
침실 불 색깔을 바꿀 수 있나요?,Can we change the color of the bedroom lights?
침실 조명을 어떻게 켜나요?,How do you turn on the bedroom lights?
침실 조명이 눈에 좋나요?,Is the bedroom lighting good for the eyes?
침실 불이 필요 없을 때도 있나요?,Are there times when we don't need the bedroom lights?
침실 불이 꺼져 있어야 하나요?,Should the bedroom lights be off?
침실 불을 꺼야 하는 이유가 있나요?,Is there a reason to turn off the bedroom lights?
침실 조명이 너무 밝나요?,Are the bedroom lights too bright?
침실 불을 어떻게 끄나요?,How do you turn off the bedroom lights?
침실에 불이 필요할 때가 언제인가요?,When is it necessary to have lights in the bedroom?
침실에 타이머 조명이 있나요?,Is there a timer light in the bedroom?
침실 불을 줄일 수 있나요?,Can the bedroom lights be dimmed?
침실 불이 너무 오래 켜져 있어요.,The bedroom lights have been on for too long.
침실 조명이 자동으로 꺼지나요?,Do the bedroom lights turn off automatically?
침실 불 끄는 스위치가 어디에 있죠?,Where is the switch to turn off the bedroom lights?
부엌 불이 이미 켜져 있나요?,Are the kitchen lights already on?
부엌 조명 스위치를 어디에서 찾을 수 있나요?,Where can I find the kitchen light switch?
부엌이 너무 어두워 보여요.,The kitchen looks too dark.
부엌 불이 고장 났나요?,Is the kitchen light broken?
부엌에 추가 조명이 필요할까요?,Do we need additional lighting in the kitchen?
부엌에 자동 조명 시스템이 설치되어 있나요?,Is there an automatic lighting system installed in the kitchen?
부엌 불의 밝기를 조절할 수 있나요?,Can the brightness of the kitchen lights be adjusted?
부엌 조명을 어떻게 켜야 하나요?,How should I turn on the kitchen lights?
부엌 조명은 에너지 효율적인가요?,Are the kitchen lights energy-efficient?
부엌에 불이 필요 없는 때도 있나요?,Are there times when we don't need lights in the kitchen?
부엌 불을 지금 꺼야 하나요?,Do I need to turn off the kitchen lights now?
부엌 불을 꺼야 할 특별한 이유가 있나요?,Is there a special reason to turn off the kitchen lights?
부엌 조명이 너무 밝게 느껴지나요?,Do the kitchen lights feel too bright?
부엌 불을 어떻게 끄죠?,How do I turn off the kitchen lights?
부엌에서 불이 꼭 필요한 상황은 언제인가요?,When is it absolutely necessary to have lights on in the kitchen?
부엌에 타이머로 작동하는 조명이 있나요?,Does the kitchen have timer-operated lights?
부엌 불의 밝기를 어떻게 줄일 수 있나요?,How can I reduce the brightness of the kitchen lights?
부엌 불이 오랫동안 켜져 있었네요.,The kitchen lights have been on for a long time.
부엌 조명은 자동으로 꺼지나요?,Do the kitchen lights turn off automatically?
부엌 불 끄는 스위치를 어디에서 찾을 수 있나요?,Where can I find the switch to turn off the kitchen lights?
에어컨을 끄면 너무 덥지 않을까요?,Won't it be too hot if we turn off the air conditioner?
에어컨을 꺼도 충분히 시원할까요?,Will it be cool enough if we turn off the air conditioner?
에어컨을 끄는 것이 더 경제적인가요?,Is it more economical to turn off the air conditioner?
에어컨을 끄면 얼마나 에너지를 절약할 수 있나요?,How much energy can we save by turning off the air conditioner?
에어컨을 끄고 창문을 열어볼까요?,Shall we turn off the air conditioner and open the windows?
에어컨이 너무 오래 켜져 있었어요.,The air conditioner has been on for too long.
에어컨을 꺼야 환경에 좋나요?,Is it better for the environment to turn off the air conditioner?
에어컨 끄는 스위치가 어디 있죠?,Where is the switch to turn off the air conditioner?
에어컨을 끄면 더 건강에 좋나요?,Is it healthier to turn off the air conditioner?
에어컨을 끄는 것이 실내 공기 질을 개선하나요?,Does turning off the air conditioner improve indoor air quality?
에어컨이 이미 켜져 있나요?,Is the air conditioner already on?
에어컨 리모콘을 어디에 뒀어요?,Where did you put the air conditioner remote?
지금 에어컨이 필요한가요?,Do we need the air conditioner right now?
에어컨이 고장 난 것 같아요.,I think the air conditioner is broken.
에어컨을 쓰지 않는 방법은 무엇인가요?,What are the ways to avoid using the air conditioner?
에어컨 없이도 시원하게 지낼 수 있나요?,Can we stay cool without the air conditioner?
에어컨 대신 선풍기를 켜볼까요?,Shall we turn on the fan instead of the air conditioner?
에어컨이 너무 시끄러운 것 같아요.,The air conditioner seems too noisy.
에어컨을 얼마나 자주 청소해야 하나요?,How often should the air conditioner be cleaned?
에어컨이 에너지를 많이 사용하나요?,Does the air conditioner use a lot of energy?
TV가 이미 켜져 있나요?,Is the TV already on?
TV 리모콘을 어디에 뒀어요?,Where did you put the TV remote?
지금 TV 볼 시간이 맞나요?,Is it the right time to watch TV now?
TV 소리가 너무 큰 것 같아요.,The TV sound seems too loud.
TV 안 보고 책을 읽을까요?,Shall we read a book instead of watching TV?
TV가 고장 난 것 같아요.,I think the TV is broken.
TV 프로그램 뭐가 있는지 알아볼까요?,Should we check what TV programs are available?
TV 색상이 이상해 보여요.,The TV colors look strange.
TV를 보는 대신 운동을 할까요?,Shall we exercise instead of watching TV?
TV가 에너지를 많이 사용하나요?,Does the TV use a lot of energy?
TV를 끄면 지루하지 않을까요?,Won't it be boring if we turn off the TV?
TV를 끄면 다른 무엇을 할 수 있나요?,What can we do if we turn off the TV?
TV를 끄는 것이 더 건강에 좋은가요?,Is it healthier to turn off the TV?
TV를 끄면 얼마나 에너지를 절약할 수 있나요?,How much energy can we save by turning off the TV?
TV를 끄고 대화를 나눠볼까요?,Shall we turn off the TV and have a conversation?
TV가 너무 오래 켜져 있었어요.,The TV has been on for too long.
TV를 끄는 것이 집중에 도움이 되나요?,Does turning off the TV help with concentration?
TV 끄는 스위치를 어디에서 찾을 수 있나요?,Where can I find the switch to turn off the TV?
TV를 끄고 책을 읽는 게 어떨까요?,How about turning off the TV and reading a book?
TV를 끄면 잠을 더 잘 잘 수 있나요?,Can we sleep better if we turn off the TV?
현재 설정된 언어가 무엇인가요?,What is the currently set language?
언어 설정을 어떻게 바꿀 수 있나요?,How can I change the language settings?
영어 이외의 다른 언어도 설정할 수 있나요?,Can I set languages other than English?
언어 설정 변경이 필요한 이유가 무엇인가요?,What is the reason for needing to change the language settings?
언어 설정을 변경하는 데 시간이 얼마나 걸리나요?,How long does it take to change the language settings?
언어 설정을 영어로 바꾸면 어떤 변화가 있나요?,What changes occur if I change the language settings to English?
모든 언어가 지원되나요, 아니면 영어만 가능한가요?,Are all languages supported, or is it only possible to set to English?
언어 설정을 바꾸면 사용자 인터페이스에 어떤 영향을 미치나요?,How does changing the language settings affect the user interface?
현재 언어 설정이 만족스럽지 않으신가요?,Are you not satisfied with the current language settings?
언어 설정을 바꾸려면 어떤 절차를 따라야 하나요?,What procedure do I need to follow to change the language settings?
현재 독일어로 설정할 수 있는 언어가 무엇인가요?,What languages are currently available to set to German?
언어 설정 변경하는 방법을 알려줄 수 있나요?,Can you tell me how to change the language settings?
언어를 독일어 이외의 언어로 설정할 수 있나요?,Can I set the language to something other than German?
언어 설정 변경에 필요한 단계는 무엇인가요?,What are the steps required to change the language settings?
독일어 설정으로 변경한 후 어떤 기능이 달라지나요?,What features change after setting the language to German?
언어를 변경하면 시스템에 어떤 영향을 미치나요?,What impact does changing the language have on the system?
언어 설정을 독일어로 하면 무엇이 좋나요?,What are the benefits of setting the language to German?
다른 언어들도 독일어처럼 쉽게 설정할 수 있나요?,Can other languages be set as easily as German?
언어 설정을 변경할 때 주의해야 할 점이 있나요?,Are there any precautions to take when changing the language settings?
 다른 소리 설정은 어떻게 변경하나요?,How do I change other sound settings?
더 조용한 환경을 선호하시나요?,Do you prefer a quieter environment?
볼륨을 높이면 어떤 영향이 있나요?,What impact does increasing the volume have?
소리를 낮추는 것이 더 적절한가요?,Is it more appropriate to lower the sound?
음량 조절에 도움이 필요하신가요?,Do you need help with volume control?
## 2. voice_registry.py

```python
# dictionary mapping each language to a list of voices within that language
# language identifiers should be lower-case
VOICES = {
    "korean": [
        'Chae-Won',
        'Min-Ho',
        'Seo-Yeon',
        'Tae-Hee',
        'Joon-Gi',
        'In-Guk',
        'Hye-Rim',
        'Ji-Sung',
        'Jae-Hyun',
        'Yoo-Jung',
        'Ji-Yeon',
        'Bo-Young',
        'Da-Hee',
        'Hye-Kyo'
    ],
    "english": {
        "uk": [
            'Beatrice',
            'Nelson',
            'Alfred',
            'Spencer',
            'Elisabeth',
            'Charles',
            'Carol',
            'William',
            'Emma',
            'Brian',
            'Amy',
            'Grace',
            'Helen',
            'Angus',
            'Keira',
            'Ellie',
            'George',
            'Rosalind',
            'Edward',
            'Victoria',
            'Gabrielle',
            'Theodore',
            'Emilia',
            'Ian',
            'Rory',
            'Cordelia',
            'Conrad',
            'Harriet',
            'Felicity',
            'Lynne',
            'Kayla',
            'Lindsey',
            'Dorothy',
            'Rebecca',
            'David',
            'Daniel',
            'Harry',
            'James',
            'Daphne',
            'Ollie',
            'Archie'
        ],
        "us": [
            'Matt',
            'Linda',
            'Betty',
            'Jessica',
            'Ben',
            'Melissa',
            'Chris',
            'Shannon',
            'Mike',
            'Bill',
            'Sarah',
            'Jeff',
            'Maggie',
            'Lisa',
            'Mary',
            'Karen',
            'Tom',
            'Jack',
            'Joanna',
            'Dustin',
            'Tony',
            'Kelly',
            'Wanda',
            'Rodney',
            'Britney',
            'Steve',
            'Jennifer',
            'Julia',
            'Rhonda',
            'Martin',
            'John',
            'Will',
            'Morgan',
            'Eddie',
            'Jodie',
            'Debbie',
            'Nancy',
            'Kim',
            'Lucy',
            'Beverly',
            'Amber',
            'Ashley',
            'Mark',
            'Connie',
            'Sandra',
            'Holly',
            'Harrison',
            'Jackie',
            'Kirk',
            'Mia',
            'Chuck',
            'Ronald',
            'Brad',
            'Paul',
            'Julie',
            'Ivy',
            'Bridget',
            'Tracy',
            'Walter',
            'Eric',
            'Amanda',
            'Tina',
            'Chad',
            'Gary',
            'Raymond',
            'Cindy',
            'Mickey',
            'Missy',
            'Timmy',
            'Bonnie',
            'Lenny',
            'Justin'
        ],
        "canada": [
            'Ryan',
            'Pamela'
        ],
        "scotish": [
            'Shirley',
            'Aileen',
            'Malcolm',
            'Gerard',
            'Fiona',
            'Connor'
        ],
        "welsh": [
            'Cerys',
            'Gareth',
            'Megan',
            'Floyd',
            'Siwan',
            'Gwyneth',
            'Ieuan',
            'Lewis'
        ],
        'australia': [
            'Graham',
            'Gail',
            'Kylie',
            'Liam',
            'Kate',
            'Bruce',
            'Olivia',
            'Judy',
            'Clive',
            'Ross',
            'Sally',
            'Patti',
            'Robin',
            'Shane',
            'Virginia',
            'Troy',
            'Greg',
            'Tamsin',
            'Kimberly',
            'Alan',
            'Emily',
            'Russel',
            'Tara',
            'Ruth'
        ],
        "new_zealand": [
            'Rose',
            'Keith',
            'Brooke'
        ],
        "irish": [
            'Cillian',
            'Saoirse',
            'Bronagh',
            'Orla'
        ],
        "indian": [
            'Lakshmi',
            'Rajesh',
            'Dilip',
            'Deepika',
            'Neerja',
            'Prabhat',
            'Pooja',
            'Shilpa',
            'Gopal'
        ],
        "south_africa": [
            'Charlize',
            'Aletta',
            'Piet'
        ],
        "nigeria": [
            'Obinna',
            'Thandiwe'
        ],
        "phillipines": [
            'Manny',
            'Elma'
        ]
    },
    "japanese": [
        "Yuriko",
        "Akira",
        "Kasumi",
        "Kenichi",
        "Tomoka",
        "Takuya",
        "Takeshi",
        "Mariko",
        "Kei",
        "Ayami",
        "Hideaki",
        "Kaori",
        "Kenji",
        "Kuniko"
    ]
}
```

## 3. [README.md](http://readme.md/)

To test, use the command:

python narakeet_generate_stt.py ${APIKEY} Korean example.csv test --skip_header 1

## 4. Narakeet API Key:

- Use the following Narakeet API key for testing purposes:

```
PJNGN13Xbg17xtqe45CtG6PgfZsdgqE99NErygvy
```

- Ensure the API key is securely stored and not exposed in the codebase

## 5. narakeet_generate_stt.py

```python
HEAD = """This script is used to generate synthetic STT audio
from Narakeet via API given the following:

- A narakeet API key
- A string identifier of the language
- A csv file with format:
    intent 1, phrase 1,
    intent 2, phrase 2,
    ...
- An output directory
"""
import requests
from tempfile import NamedTemporaryFile
from tqdm import tqdm
from pathlib import Path
import string
import csv
import os
import argparse
from typing import *
from voice_registry import VOICES

URL = 'https://api.narakeet.com/text-to-speech/m4a?voice='

def narakeet_generate(voice: str, phrase: str, outfile: str, apikey: str):
    """
    Send a request to narakeet; download the audio; convert from .m4a to
    final data format

    Arguments:
        voice (str): string identifier of the narakeet voice
        phrase (str): phrase to be generated
        outfile (str): output file to save in. Note that the final file format is inferred
            from the ending (e.g. ".wav")
        apikey (str): narakeet API key
    """
    url = f'https://api.narakeet.com/text-to-speech/m4a?voice={voice}'
    options = {
        'headers': {
            'Accept': 'application/octet-stream',
            'Content-Type': 'text/plain',
            'x-api-key': apikey,
        },
        'data': phrase.encode('utf8')
    }
    with NamedTemporaryFile(suffix=".m4a") as f:
        with open(f.name, 'wb') as f:
            f.write(requests.post(url, **options).content)

        os.system(f"ffmpeg -y -hide_banner -loglevel error -i {f.name} {outfile}")

def load_csv(path: str, skip_header: int=0):
    """Loads a csv intent file into a dictionary storing 'phrase-to-intent'

    e.g. {"please turn on the lights": "lights-on", "turn off the lights now!": "lights-off"}

    Arguments:
        path (str): path to the csv file
        skip_header (int): number of initial lines to skip as header lines. Default 0.
    """
    with open(path, 'r') as f:
        csv_reader = csv.reader(f)
        # convert string to list
        data = list(csv_reader)[skip_header:] # skip header

        phrase2intent = {}
        for intent, phrase in data:
            phrase2intent[phrase] = intent

    return phrase2intent

def load_csv_distractors(path: str, skip_header: int=0):
    """Loads a csv intent file into a dictionary storing 'phrase-to-intent'

    e.g. {"please turn on the lights": "lights-on", "turn off the lights now!": "lights-off"}

    Arguments:
        path (str): path to the csv file
        skip_header (int): number of initial lines to skip as header lines. Default 0.
    """
    with open(path, 'r') as f:
        csv_reader = csv.reader(f)
        # convert string to list
        data = list(csv_reader)[skip_header:] # skip header

        phrase2intent = {}
        for i, (korean_phrase, english_phrase) in enumerate(data):
            phrase2intent[korean_phrase] = f'distractor_{i}'

    return phrase2intent

def batch_generate(voices: List[str], phrase2intent: dict, outdir: str, apikey: str):

    print(f"Making directory {outdir}")
    os.makedirs(outdir, exist_ok=True)
    outdir = Path(outdir)
    for i, voice in enumerate(voices):
        print(f"[{i+1}/{len(voices)}]: Iterating through {len(phrase2intent)} phrases with voice {voice}")

        for phrase, intent in tqdm(phrase2intent.items()):
            intent_stripped = intent.translate(str.maketrans("","", string.punctuation))
            phrase_stripped = phrase.translate(str.maketrans("","", string.punctuation))
            dir = outdir / intent_stripped.upper().replace(" ", "-") / phrase_stripped.replace(" ", "-")
            os.makedirs(dir, exist_ok=True)

            path = dir / f"{voice}.wav"

            if os.path.exists(path):
                print(f'{path} already processed, skipping!')
                continue

            narakeet_generate(voice, phrase, path, apikey)

def main():
    parser = argparse.ArgumentParser(description=HEAD)
    parser.add_argument("--apikey", type=str, help='Narakeet API key. Ask Scott for it.') # WE6BSNiQqZ2MAInKGsFrkyoKqJ7XVxOQ3BjUmR80
    parser.add_argument("--language", type=str, help='Language to be used for generations')
    parser.add_argument("--intent_csv", type=str, help="CSV file for intent/phrase definitions")
    parser.add_argument("--outdir", type=str, help="Directory to save generations")
    parser.add_argument("--skip_header", type=int, default=1, help='Number of header lines to skip when loading csv')
    args = parser.parse_args()
    phrase2intent = load_csv(args.intent_csv, args.skip_header) # load_csv_distractors(args.intent_csv, args.skip_header)  # load_csv(args.intent_csv, args.skip_header)
    voices = VOICES[args.language.lower()]
    if isinstance(voices, dict):
        # For english, format is: {'region': Voice}
        # Discard the 'region' key and simply get the flattened Voice's list
        voices = [item for sublist in voices.values() for item in sublist]

    batch_generate(voices, phrase2intent, args.outdir, args.apikey)

if __name__ == '__main__':
    main()
```

## 6. wakeword.csv

```
Intent, Phrase
ok_google,ok google
alexa,alexa
```

## 7. wakeword_distractors.csv

This file contains distractor phrases for wake words, which can be used to test the system's ability to distinguish between actual wake words and similar-sounding phrases.

```
Intent, Phrase
ok_google_distractor,Ok cool
ok_google_distractor,Okay doodle
ok_google_distractor,Oak google
ok_google_distractor,Ok noodle
ok_google_distractor,Ok poodle
ok_google_distractor,Okay moogle
ok_google_distractor,Okey doogle
ok_google_distractor,Oklahoma
ok_google_distractor,Okie dokie
ok_google_distractor,Oughta google
ok_google_distractor,Ok Goggle
ok_google_distractor,Oak Guggle
ok_google_distractor,Okey Gooey
ok_google_distractor,Okay Bugle
ok_google_distractor,Okie Googleynok_google_distractor,Oaky Boogle
ok_google_distractor,Okay Ghoulie
ok_google_distractor,Ogle Google
ok_google_distractor,Ok Go Go
ok_google_distractor,Awk Google
alexa_distractor,Alex
alexa_distractor,Alexis
alexa_distractor,Alaska
alexa_distractor,A lecture
alexa_distractor,Alex and
alexa_distractor,Alyssa
alexa_distractor,A Lakes
alexa_distractor,Elexi
alexa_distractor,Alexi
```

## 8. example.csv

This file contains examples of voice commands in Korean with their corresponding intents. It can be used as a starting point for generating variations and audio files in the Korean language.

```
Intent,Korean Phrase
turn on the lights,불 켜줘.
turn off the lights,조명을 꺼주세요
```

These files provide additional data for the Femtosense Voice Command Generation PoC application, allowing for more comprehensive testing and demonstration of the system's capabilities in handling wake words, distractors, and multilingual commands.