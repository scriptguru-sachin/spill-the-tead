FROM php:8.4-cli-alpine

RUN apk add --no-cache postgresql-dev libzip-dev $PHPIZE_DEPS \
    && docker-php-ext-install pdo_pgsql pcntl zip \
    && apk del $PHPIZE_DEPS

WORKDIR /app
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
