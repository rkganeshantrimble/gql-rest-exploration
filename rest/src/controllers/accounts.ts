import { getAccountData } from '../services/profileService.js';

const getAccountDataByAccountId = async (req, res) => {
  try {
    const accountData = await getAccountData(req.params.accountId);
    if (accountData) {
      console.log(accountData);
      res.status(200).send({ accountData });
    } else {
      throw 'Account Data not available';
    }
  } catch (err) {
    res.status(500).send({ err });
  }
};

export { getAccountDataByAccountId };
