<center><img src="https://i.imgur.com/VIAARlb.gif" style="margin: 10px"></center>

# Matrix Signs ETL

This is a project to extract, transform and load data from the Matrix Signs open data into a database. This project is a
part of a larger project of mine in which I will use this ETL to provide data for an API which will be used by a web
application. The raw XML can be found at the [NDW Open Data Portal](http://opendata.ndw.nu/) (Matrixsignaalinformatie.xml.gz)

### Getting started
You must first install the project's dependencies. This can be done by running the following command in the root of the project:
```bash
$ npm install
```

### Creating the database

Make sure to have an instance of MariaDB running, and create a database. Specify the database name, user and password in
the `.env` file.

```shell
$ prisma db push
```

### Running the ETL
To start the ETL, run the following command in the root of the project:
```shell
$ npm run start
```
