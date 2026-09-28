export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, amount, booking_id, facility } = req.body;

  if (!email || !amount || !booking_id) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // Convert GHS amount to pesewas by multiplying by 100
  const amountInPesewas = Math.round(amount * 100);

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInPesewas,
        currency: 'GHS',
        metadata: {
          booking_id,
          facility,
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ message: data.message });
    }

    return res.status(200).json({ authorization_url: data.data.authorization_url });
  } catch (error) {
    console.error('Paystack initialization error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
