# Monitoring device for household plants


## Install the necessary libraries in the Raspberry PI for running SenseHat

```
sudo apt update
sudo apt full-upgrade
sudo apt install sense-hat
sudo reboot   
```

### After the restart we can verify by running the code below in Thonny

```
from sense_hat import SenseHat
sense = SenseHat()
sense.show_message("Hello World")
```

### This will show scrolling message "Hello World" in the LED Matrix of the sense hat.

** Now we are ready to read values and display information on the sense hat.**

## Hosting FastAPI and the React App

### Step 1 : Install Docker 

```
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### step 2 : Create dockerfiles for both frontend and backend

### step 3 : Create docker-compose and set restart: always to autostart the apps on boot. 
