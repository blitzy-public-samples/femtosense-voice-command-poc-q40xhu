import os
from setuptools import setup, find_packages

# Utility function to read the README file.
# Used for the long_description.  It's nice, because now 1) we have a top level
# README file and 2) it's easier to type in the README file than to put a raw
# string in below ...
def read(fname):
    return open(os.path.join(os.path.dirname(__file__), fname)).read()

# Read version from a file
VERSION = '0.1.0'

# Read requirements from requirements.txt
with open('requirements.txt') as f:
    required = f.read().splitlines()

setup(
    name="femtosense-voice-command-database",
    version=VERSION,
    author="Femtosense",
    author_email="info@femtosense.com",
    description=("Database component for the Femtosense Voice Command Generation PoC system"),
    license="Proprietary",
    keywords="voice command database",
    url="https://github.com/femtosense/voice-command-poc",
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    long_description=read('README.md'),
    long_description_content_type='text/markdown',
    install_requires=required,
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Topic :: Utilities",
        "License :: Other/Proprietary License",
    ],
    python_requires='>=3.7',
    extras_require={
        'dev': [
            'pytest',
            'pytest-cov',
            'mypy',
        ],
    },
)