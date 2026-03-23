<?php
/**
 * Plugin Name: PTA WooCommerce Order Sync
 * Description: Synchroniseert betaalde WooCommerce-bestellingen naar de PTA app.
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const PTA_APP_ORDER_SYNC_URL    = 'https://pure-therapeutic-art-therapy.com/api/orders/sync';
const PTA_APP_ORDER_SYNC_SECRET = 'Pf#T3tPK8J9fzv6$mL#xgA5G3hHFotx3vEsbIDVn';

function pta_wc_sync_paid_order( $order_id ) {
	if ( ! function_exists( 'wc_get_order' ) ) {
		return;
	}

	$order = wc_get_order( $order_id );
	if ( ! $order instanceof WC_Order ) {
		return;
	}

	$items = array();
	foreach ( $order->get_items() as $item_id => $item ) {
		$product = $item->get_product();
		if ( ! $product ) {
			continue;
		}

		$kind = get_post_meta( $product->get_id(), '_pta_item_kind', true );
		if ( ! $kind ) {
			$kind = $product->is_downloadable() ? 'ebook' : 'purchase';
		}

		$content_slug    = get_post_meta( $product->get_id(), '_pta_content_slug', true );
		$content_item_id = get_post_meta( $product->get_id(), '_pta_content_item_id', true );

		$line_total = (float) $item->get_total();
		$amount_cents = (int) round( $line_total * 100 );

		$items[] = array(
			'externalOrderId' => (string) $order->get_id(),
			'externalLineId'  => (string) $item_id,
			'userId'          => $order->get_meta( '_pta_app_user_id', true ) ?: null,
			'customerEmail'   => $order->get_billing_email(),
			'kind'            => $kind,
			'title'           => $item->get_name(),
			'subtitle'        => 'WooCommerce bestelling',
			'amountCents'     => $amount_cents,
			'currency'        => $order->get_currency(),
			'occurredAt'      => $order->get_date_paid()
				? $order->get_date_paid()->date( DATE_ATOM )
				: current_time( DATE_ATOM, true ),
			'contentSlug'     => $content_slug ?: null,
			'contentItemId'   => $content_item_id ?: null,
			'metadata'        => array(
				'provider'      => 'woocommerce',
				'product_id'    => $product->get_id(),
				'product_sku'   => $product->get_sku(),
				'order_number'  => $order->get_order_number(),
				'order_status'  => $order->get_status(),
				'quantity'      => $item->get_quantity(),
				'product_url'   => get_permalink( $product->get_id() ),
			),
		);
	}

	if ( empty( $items ) ) {
		return;
	}

	wp_remote_post(
		PTA_APP_ORDER_SYNC_URL,
		array(
			'timeout' => 20,
			'headers' => array(
				'Content-Type'        => 'application/json',
				'x-order-sync-secret' => PTA_APP_ORDER_SYNC_SECRET,
			),
			'body'    => wp_json_encode(
				array(
					'source' => 'woocommerce',
					'items'  => $items,
				)
			),
		)
	);
}

add_action( 'woocommerce_order_status_processing', 'pta_wc_sync_paid_order' );
add_action( 'woocommerce_order_status_completed', 'pta_wc_sync_paid_order' );
