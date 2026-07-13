<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function tela_setup(): void {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', [ 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ] );
}
add_action( 'after_setup_theme', 'tela_setup' );

function tela_enqueue_assets(): void {
    wp_enqueue_style(
        'tela-main',
        get_template_directory_uri() . '/assets/css/main.css',
        [],
        '1.0.0'
    );
    wp_enqueue_script(
        'tela-main',
        get_template_directory_uri() . '/assets/js/main.js',
        [],
        '1.0.0',
        true
    );
}
add_action( 'wp_enqueue_scripts', 'tela_enqueue_assets' );
