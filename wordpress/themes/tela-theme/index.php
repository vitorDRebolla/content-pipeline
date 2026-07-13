<?php get_header(); ?>

<main class="flex-grow-1 py-5">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
                    <article class="mb-5 pb-5 border-bottom">
                        <h2 class="h4 mb-2">
                            <a href="<?php the_permalink(); ?>" class="text-dark">
                                <?php the_title(); ?>
                            </a>
                        </h2>
                        <p class="text-muted small mb-3"><?php echo esc_html( get_the_date() ); ?></p>
                        <p class="mb-3"><?php the_excerpt(); ?></p>
                        <a href="<?php the_permalink(); ?>" class="btn btn-sm btn-outline-primary">
                            Read more
                        </a>
                    </article>
                <?php endwhile; else : ?>
                    <p class="text-muted">No posts yet.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?>
