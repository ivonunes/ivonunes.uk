import { Controller } from "@hotwired/stimulus"

let persistedActiveHref = null
let persistedTranslateValue = null

export default class extends Controller {
  static targets = ["link", "sliderCircle"]

  connect() {
    this.handleMouseOver = this.handleMouseOver.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.handleClick = this.handleClick.bind(this)

    this.element.addEventListener("mouseover", this.handleMouseOver)
    this.element.addEventListener("mouseleave", this.handleMouseLeave)
    this.element.addEventListener("click", this.handleClick)

    this.activeTarget = null
    this.lastHover = null
    this.currentTranslateValue = persistedTranslateValue
    this.sliderContainer = this.element.querySelector(".main-slider")

    this.primeFromPersisted()
    this.setupInitialState()
  }

  disconnect() {
    this.element.removeEventListener("mouseover", this.handleMouseOver)
    this.element.removeEventListener("mouseleave", this.handleMouseLeave)
    this.element.removeEventListener("click", this.handleClick)
  }

  setupInitialState() {
    const activeLink = this.linkTargets.find(link => link.classList.contains("active"))

    if (activeLink) {
      const shouldAnimate = persistedActiveHref && persistedActiveHref !== activeLink.href

      if (shouldAnimate && this.sliderContainer) {
        this.sliderContainer.classList.remove("no-transition")
      }

      this.updateSlider(activeLink, { animate: shouldAnimate, rememberActive: true })
    } else if (this.linkTargets.length > 0) {
      const firstLink = this.linkTargets[0]
      this.handleActiveTab(firstLink)
      this.updateSlider(firstLink, { animate: false, rememberActive: true })
    }
  }

  handleMouseOver(event) {
    const target = event.target.closest(".nav-link")
    if (!target || target.href === this.lastHover) return

    this.updateSlider(target, { animate: true })
    this.handleActiveTab(target)
  }

  handleMouseLeave() {
    if (this.activeTarget && this.activeTarget.href !== this.lastHover) {
      this.updateSlider(this.activeTarget, { animate: true, rememberActive: true })
      this.handleActiveTab(this.activeTarget)
    }
  }

  handleClick(event) {
    const target = event.target.closest(".nav-link")
    if (!target) return

    this.updateSlider(target, { animate: true, rememberActive: true })
    this.handleActiveTab(target)
  }

  handleActiveTab(target) {
    this.linkTargets.forEach(link => link.classList.remove("active"))
    target.classList.add("active")
  }

  updateSlider(target, { animate = false, rememberActive = false } = {}) {
    if (!target) return

    const translateValue = target.dataset.translateValue || "0"
    const hasChanged = translateValue !== this.currentTranslateValue
    const shouldAnimate = animate && hasChanged

    if (shouldAnimate) {
      this.animateTo(target, translateValue, rememberActive)
    } else {
      this.instantTo(target, translateValue, rememberActive)
    }
  }

  animateTo(target, translateValue, rememberActive) {
    const sliderCircle = this.hasSliderCircleTarget ? this.sliderCircleTarget : null

    if (this.sliderContainer) {
      this.sliderContainer.classList.remove("no-transition")
    }

    if (sliderCircle) {
      sliderCircle.classList.remove("animate-liquid")
      void sliderCircle.offsetWidth
    }

    this.applyTranslate(target, translateValue, rememberActive)

    if (sliderCircle) {
      sliderCircle.classList.add("animate-liquid")
    }
  }

  instantTo(target, translateValue, rememberActive) {
    if (this.sliderContainer) {
      this.sliderContainer.classList.add("no-transition")
    }

    this.applyTranslate(target, translateValue, rememberActive)

    if (this.sliderContainer) {
      requestAnimationFrame(() => {
        this.sliderContainer.classList.remove("no-transition")
      })
    }
  }

  applyTranslate(target, translateValue, rememberActive) {
    document.documentElement.style.setProperty("--translate-main-slider", translateValue)
    this.currentTranslateValue = translateValue
    this.lastHover = target.href

    if (rememberActive) {
      this.activeTarget = target
      persistedActiveHref = target.href
      persistedTranslateValue = translateValue
    }
  }

  primeFromPersisted() {
    if (!this.sliderContainer || persistedTranslateValue == null) return

    this.sliderContainer.classList.add("no-transition")
    document.documentElement.style.setProperty("--translate-main-slider", persistedTranslateValue)
  }
}
