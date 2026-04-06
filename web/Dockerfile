FROM arm32v7/nginx:alpine

# Crear un directorio para la aplicación
WORKDIR /usr/share/nginx/html

# Eliminar archivos por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar la build de la aplicación React
COPY ./dist .

# Exponer el puerto 80 (el puerto predeterminado de Nginx)
EXPOSE 80

# Comando para iniciar el servidor Nginx
CMD ["nginx", "-g", "daemon off;"]