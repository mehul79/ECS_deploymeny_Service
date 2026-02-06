FROM ubuntu:focal

# Install necessary packages
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y
RUN apt-get install -y nodejs
RUN apt-get install git -y

# Entry point
WORKDIR /home/app
COPY main.sh main.sh
ENTRYPOINT [ "home/app/main.sh" ] #when container is up this file is executed
