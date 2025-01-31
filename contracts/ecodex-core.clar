;; EcoDex Core Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u100))
(define-constant err-product-exists (err u101))
(define-constant err-invalid-score (err u102))

;; Data structures
(define-map products 
  { product-id: uint }
  {
    name: (string-utf8 64),
    manufacturer: principal,
    eco-score: uint,
    carbon-footprint: uint,
    recycled-materials: uint,
    verified: bool
  }
)

;; Public functions
(define-public (register-product 
  (product-id uint) 
  (name (string-utf8 64))
  (carbon-footprint uint)
  (recycled-materials uint))
  (let (
    (eco-score (calculate-eco-score carbon-footprint recycled-materials))
  )
    (asserts! (is-none (map-get? products {product-id: product-id})) err-product-exists)
    (ok (map-set products
      {product-id: product-id}
      {
        name: name,
        manufacturer: tx-sender,
        eco-score: eco-score,
        carbon-footprint: carbon-footprint,
        recycled-materials: recycled-materials,
        verified: false
      }
    ))
  )
)

(define-public (verify-product (product-id uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-not-authorized)
    (match (map-get? products {product-id: product-id})
      product (ok (map-set products 
        {product-id: product-id}
        (merge product {verified: true})
      ))
      (err err-not-authorized)
    )
  )
)

;; Read only functions
(define-read-only (get-product-details (product-id uint))
  (map-get? products {product-id: product-id})
)

(define-read-only (calculate-eco-score (carbon uint) (recycled uint))
  (let
    (
      (carbon-score (- u100 (/ carbon u10)))
      (recycled-score (/ recycled u1))
    )
    (if (> (+ carbon-score recycled-score) u100)
      u100
      (+ carbon-score recycled-score)
    )
  )
)
