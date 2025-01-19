!(() => {
  const bg =  document.getElementById('bg')
  const elements = [].slice.call(document.querySelectorAll('.js-marqy'))

  function setDimensionVariables() {
    bg.style.setProperty('--bg-height', bg.getBoundingClientRect().height + 'px')
    bg.style.setProperty('--marquee-element-width', elements[0].getBoundingClientRect().width + 'px')
  }

  window.addEventListener('resize', e => {
    setDimensionVariables()
  })

  setDimensionVariables()
})()

function marqy (outer, inner) {
  let prevReps = 0
  let reps = 0

  window.addEventListener('resize', e => {
    let w = outer.getBoundingClientRect().width

    reps = Math.ceil(node.getBoundingClientRect().width / w)

    if (reps !== prevReps) {
      while (inner.children.length > 1) {
        inner.children[inner.children.length - 1].remove()
      }

      for (let i = 0; i < reps; i++) {
        let clone = outer.cloneNode(true)
        clone.setAttribute('aria-hidden', 'true')
        inner.append(clone)
      }
    }

    node.style.setProperty('--x', Math.round(w))

    prevReps = reps
  })
}

/*
  let { inner, el } = choozy(node)


  let offIo = io(node, {
    enter: () => {
      inner.style.animationPlayState = null
    },
    exit: () => {
      inner.style.animationPlayState = 'paused'
    },
  })

  return () => offIo()
  */
