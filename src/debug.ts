if (process.env.NODE_ENV !== 'development') {
  console.log = () => { }
  // console.error = () => { }
  console.warn = () => { }
}

export {}