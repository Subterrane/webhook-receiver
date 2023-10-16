export default function handler(req, res) {
  const { body } = req;

  try {
    console.log(JSON.parse(body));
  } catch {
    console.log(body);
  }
  
  res.status(200).end();
}
