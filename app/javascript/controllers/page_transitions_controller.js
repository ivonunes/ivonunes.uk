import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["wrapper"]

  initialize() {
    this.handleTurboLoad = this.handleTurboLoad.bind(this)
    this.handleBeforeRender = this.handleBeforeRender.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.clickTime = 0
    this.touchOptions = { passive: true }
  }

  connect() {
    document.addEventListener("turbo:load", this.handleTurboLoad)
    document.addEventListener("turbo:before-render", this.handleBeforeRender)
    document.addEventListener("turbo:click", this.handleClick)
    document.addEventListener("touchstart", this.handleTouchStart, this.touchOptions)
  }

  disconnect() {
    document.removeEventListener("turbo:load", this.handleTurboLoad)
    document.removeEventListener("turbo:before-render", this.handleBeforeRender)
    document.removeEventListener("turbo:click", this.handleClick)
    document.removeEventListener("touchstart", this.handleTouchStart, this.touchOptions)
  }

  handleTouchStart() {
    // intentional no-op to ensure :active styles on iOS
  }

  handleTurboLoad() {
    const wrapper = this.wrapperElement
    if (!wrapper) return

    wrapper.classList.remove("animate__slideOutDown", "animate__faster")
    if (!wrapper.classList.contains("animate__slideInUp")) {
      wrapper.classList.add("animate__slideInUp")
    }
  }

  async handleBeforeRender(event) {
    event.preventDefault()

    const newBody = event.detail.newBody
    newBody.querySelector(".header")?.classList.remove("animate__animated", "animate__fadeInDown")
    newBody.querySelector(".wrapper")?.classList.add("animate__faster")

    const timeout = this.transitionDelay()
    if (timeout > 0) {
      await new Promise(resolve => setTimeout(resolve, timeout))
    }

    event.detail.resume()
  }

  handleClick() {
    const wrapper = this.wrapperElement
    if (wrapper) {
      wrapper.classList.remove("animate__slideInUp")
      wrapper.classList.add("animate__slideOutDown", "animate__faster")
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
    this.clickTime = Date.now()
  }

  transitionDelay() {
    const elapsed = Date.now() - this.clickTime
    return Math.max(0, 250 - elapsed)
  }

  get wrapperElement() {
    if (this.hasWrapperTarget) {
      return this.wrapperTarget
    }

    return document.querySelector(".wrapper")
  }
}
