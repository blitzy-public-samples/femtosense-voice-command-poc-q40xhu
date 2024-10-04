"""
Femtosense Voice Command Generation PoC - Backend Setup

This setup file defines the installation and distribution settings for the
Femtosense Voice Command Generation PoC backend component.

Requirements addressed:
- Package Management (Technical Specification/4.2 FRAMEWORKS AND LIBRARIES)
- Installation Configuration (Technical Specification/5.3 CONTAINERIZATION)
- Development Environment (Technical Specification/4.1 PROGRAMMING LANGUAGES)

Author: Femtosense Development Team
Date: 2023-05-20
"""

import os
from setuptools import setup, find_packages

# Constants
VERSION = '1.0.0'
DESCRIPTION = 'Femtosense Voice Command Generation PoC Backend'
LONG_DESCRIPTION = 'A Python package for generating voice command variations and audio files.'

# Utility function to read the README file
def read_file(filename):
    with open(os.path.join(os.path.dirname(__file__), filename)) as file:
        return file.read()

# Utility function to read the requirements file
def read_requirements(filename):
    return [line.strip() for line in read_file(filename).splitlines()
            if not line.startswith('#') and line.strip()]

setup(
    name='femtosense-voice-command',
    version=VERSION,
    description=DESCRIPTION,
    long_description=read_file('README.md'),
    long_description_content_type='text/markdown',
    author='Femtosense',
    author_email='support@femtosense.com',
    url='https://github.com/femtosense/voice-command-poc',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    include_package_data=True,
    install_requires=read_requirements('requirements.txt'),
    extras_require={
        'dev': [
            'pytest>=6.2.5',
            'pytest-cov>=2.12.1',
            'mypy>=0.910',
            'black>=21.7b0',
            'isort>=5.9.3',
            'flake8>=3.9.0',
        ],
    },
    entry_points={
        'console_scripts': [
            'narakeet-generate=narakeet_generate_stt:main',
        ],
    },
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
    ],
    python_requires='>=3.7',
    license='MIT',
    keywords='voice command generation, text-to-speech, audio processing',
)