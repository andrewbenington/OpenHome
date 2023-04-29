echo "Checking envs..."
if [[ -z "${GH_TOKEN}" ]]; then
  echo "GH_TOKEN not present; exiting"
  exit 1
else
  echo "GH_TOKEN is present"
fi

if [[ $* == *--mac* ]]; then
  if [[ -z "${APPLE_ID}" ]]; then
    echo "APPLE_ID not present; exiting"
    exit 1
  else
    echo "APPLE_ID is present"
  fi
  if [[ -z "${APPLE_ID_PASS}"  ]]; then
    echo "APPLE_ID_PASS not present; exiting"
    exit 1
  else
    echo "APPLE_ID_PASS is present"
  fi
fi