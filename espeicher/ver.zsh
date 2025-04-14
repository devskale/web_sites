#!/bin/zsh

# Check if filename argument is provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 <filename>"
  exit 1
fi

original_file=$1

# Extract base filename and extension
base_name=${original_file%.*}
extension=${original_file##*.}

# Find all existing versioned files in ver directory
versions=($(ls ./ver/${base_name}_v* 2>/dev/null | sort -V))

# Determine next version number
if [ ${#versions[@]} -eq 0 ]; then
  # No existing versions, start with 0.0.1
  new_version="0.0.1"
else
  # Get highest version
  last_file=${versions[-1]}
  last_version=${last_file#*_v}
  last_version=${last_version%.*}

  # Split version into components
  IFS='.' read -r major minor patch <<< "$last_version"

  # Increment version
  if [ $patch -lt 9 ]; then
    patch=$((patch + 1))
  else
    patch=0
    if [ $minor -lt 9 ]; then
      minor=$((minor + 1))
    else
      minor=0
      major=$((major + 1))
    fi
  fi

  new_version="${major}.${minor}.${patch}"
fi

# Create new filename
new_file="${base_name}_v${new_version}.${extension}"

# Create ver directory if it doesn't exist
mkdir -p "./ver"

# Copy file to ver directory
cp "$original_file" "./ver/$new_file"
echo "./ver/$new_file"