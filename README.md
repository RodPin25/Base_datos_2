# Rama de Arturo

En esta rama voy a estar subiendo mis avances del proyecto.


# Guia para DB Juan Luis
Primero crea una carpeta para el proyecto, ahi vamos a almacenar todo lo que tengamos que hacer
Tenes que crear un archivo llamaod ".env", ahi creas la variable "CString", se llena con la cadena que te voy a pasar

1. Clona el repo en una subcarpeta de la original
```bash
git clone https://github.com/RodPin25/Base_datos_2 Repositorio/
```
```bash
cd Repositorio/
```
2. Movete a mi rama
```bash
git fetch --all
```
```bash
git checkout arturo
```
3. Tenes que ejecutar el siguiente comando en alguna terminal

```bash
ssh -L 14333:localhost:1433 Brxckin@157.137.185.15`
```
4. Tenes que ejecutar el python llamado conexiondb.py