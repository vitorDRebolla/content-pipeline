<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class( 'd-flex flex-column min-vh-100' ); ?>>

<header>
    <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: #1a1a2e;">
        <div class="container">
            <a class="navbar-brand fw-bold fs-5" href="<?php echo esc_url( home_url( '/' ) ); ?>">
                <?php bloginfo( 'name' ); ?>
            </a>
        </div>
    </nav>
</header>
