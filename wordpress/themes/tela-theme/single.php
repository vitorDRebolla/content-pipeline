<?php get_header(); ?>

<?php while ( have_posts() ) : the_post(); ?>

<article>

    <div class="post-hero py-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">

                    <?php
                    $categories = get_the_category();
                    if ( $categories ) : ?>
                        <span class="badge bg-primary category-badge mb-4 d-inline-block">
                            <?php echo esc_html( $categories[0]->name ); ?>
                        </span>
                    <?php endif; ?>

                    <h1 class="post-title display-5 fw-bold mb-4">
                        <?php the_title(); ?>
                    </h1>

                    <?php if ( get_the_excerpt() ) : ?>
                        <p class="lead text-muted mb-4">
                            <?php echo esc_html( get_the_excerpt() ); ?>
                        </p>
                    <?php endif; ?>

                    <div class="post-meta d-flex gap-4 text-muted">
                        <span><?php echo esc_html( get_the_date( 'F j, Y' ) ); ?></span>
                        <span>
                            <?php
                            $word_count = str_word_count( wp_strip_all_tags( get_the_content() ) );
                            $read_time  = max( 1, (int) ceil( $word_count / 200 ) );
                            echo esc_html( $read_time . ' min read' );
                            ?>
                        </span>
                    </div>

                </div>
            </div>
        </div>
    </div>

    <div class="py-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="post-content">
                        <?php the_content(); ?>
                    </div>

                    <div class="mt-5 pt-4 border-top">
                        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="text-decoration-none text-muted small">
                            &larr; Back to home
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

</article>

<?php endwhile; ?>

<?php get_footer(); ?>
