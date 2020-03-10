FROM ubuntu:16.04

RUN apt-get update -y && \
    apt-get install -y libmysqlclient-dev python-pip python-dev

RUN python --version && pip --version

COPY . /app

WORKDIR /app

RUN pip install -r requirements.txt

RUN python tests.py

ARG environment
ENV ENVIRONMENT=$environment
ARG dbuser
ENV DATABASE_USERNAME=$dbuser
ARG dbpass
ENV DATABASE_PASSWORD=$dbpass
ARG dbendpoint
ENV DATABASE_ENDPOINT=$dbendpoint
ARG dbschema
ENV DATABASE_SCHEMA=$dbschema

EXPOSE 5000

CMD python runserver.py
