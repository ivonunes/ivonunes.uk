import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["image"]

  connect() {
    this.elementsToResize = new Set()
    this.handleResize = this.debounce(() => this.resizeAllElements(), 100)
    window.addEventListener("resize", this.handleResize)
    this.setupObserver()
    this.imageTargets.forEach(image => this.observeImage(image))

    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
      window.requestAnimationFrame(() => this.resizeAllElements())
    } else {
      this.resizeAllElements()
    }
  }

  disconnect() {
    window.removeEventListener("resize", this.handleResize)
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.elementsToResize.clear()
  }

  observeImage(image) {
    if (!image) return

    if (image.loading === "lazy" && this.observer) {
      this.observer.observe(image)
    } else {
      this.activateImage(image)
    }
  }

  setupObserver() {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      this.observer = null
      return
    }

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          this.activateImage(img)
          this.observer.unobserve(img)
        }
      })
    }, { rootMargin: "50px" })
  }

  activateImage(image) {
    if (!image || image.dataset.photoGridActive === "true") return

    image.dataset.photoGridActive = "true"
    this.elementsToResize.add(image)

    const listItem = image.closest("li")
    const onLoad = () => {
      this.setSquareDimensions(image)
      if (listItem) {
        listItem.classList.add("loaded")
      }
      image.classList.add("visible")
    }

    const onError = () => {
      this.elementsToResize.delete(image)
      if (listItem) {
        listItem.innerHTML = "Failed to load image"
        listItem.style.padding = "2rem"
        listItem.style.textAlign = "center"
      }
    }

    image.addEventListener("load", onLoad, { once: true })
    image.addEventListener("error", onError, { once: true })

    if (image.complete && image.naturalWidth !== 0) {
      onLoad()
    }
  }

  resizeAllElements() {
    this.elementsToResize.forEach(element => {
      if (element.isConnected) {
        this.setSquareDimensions(element)
      } else {
        this.elementsToResize.delete(element)
      }
    })
  }

  setSquareDimensions(element) {
    element.style.height = `${element.offsetWidth}px`
  }

  debounce(func, wait) {
    let timeout
    return (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }
}
