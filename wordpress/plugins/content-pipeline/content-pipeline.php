<?php
/**
 * Plugin Name: Content Pipeline
 * Description: Receives AI-generated content via webhook and publishes it as a WordPress post.
 * Version: 1.0.0
 * Author: Vitor Rebolla
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'rest_api_init', function () {
    register_rest_route( 'content-pipeline/v1', '/publish', [
        'methods'             => 'POST',
        'callback'            => 'cp_publish_post',
        'permission_callback' => '__return_true',
    ] );
} );

function cp_publish_post( WP_REST_Request $request ): WP_REST_Response {
    $auth     = $request->get_header( 'authorization' );
    $secret   = defined( 'CONTENT_PIPELINE_SECRET' ) ? CONTENT_PIPELINE_SECRET : '';
    $expected = 'Bearer ' . $secret;

    if ( empty( $secret ) || $auth !== $expected ) {
        return new WP_REST_Response( [ 'error' => 'Unauthorized' ], 401 );
    }

    $body    = $request->get_json_params();
    $title   = sanitize_text_field( $body['title'] ?? '' );
    $content = wp_kses_post( $body['content'] ?? '' );
    $excerpt = sanitize_text_field( $body['excerpt'] ?? '' );
    $status  = in_array( $body['status'] ?? '', [ 'publish', 'draft' ], true ) ? $body['status'] : 'publish';

    if ( empty( $title ) || empty( $content ) ) {
        return new WP_REST_Response( [ 'error' => 'Title and content are required' ], 400 );
    }

    $post_id = wp_insert_post( [
        'post_title'   => $title,
        'post_content' => $content,
        'post_excerpt' => $excerpt,
        'post_status'  => $status,
        'post_author'  => 1,
    ] );

    if ( is_wp_error( $post_id ) ) {
        return new WP_REST_Response( [ 'error' => $post_id->get_error_message() ], 500 );
    }

    return new WP_REST_Response( [
        'id'   => $post_id,
        'link' => get_permalink( $post_id ),
    ], 201 );
}
