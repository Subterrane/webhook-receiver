export default function handler(req, res) {
  console.log("-------\n", new Date().toISOString(), req.method, req.url);
  const { body } = req;
  
  try {
    console.log(JSON.parse(body));
  } catch {
    console.log(body);
  }

  res.status(200).end();
}
