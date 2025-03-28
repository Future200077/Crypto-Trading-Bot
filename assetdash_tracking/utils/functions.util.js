exports.log = (_) => {
	console.log(_)
}

exports.getHeader = () => {

  const token = global.token;
  if (token) return { Authorization: 'Bearer ' + token }
  else return {}

}