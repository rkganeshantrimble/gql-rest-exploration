import { getAccountData } from '../services/profileService.js';

const getAccountDataByAccountId = async (req, res) => {
  try {
    console.log('req.params.accountId::', req.params.accountId);
    console.log('req.query.users::', req.query.users);
    const accountData = await getAccountData(
      req.params.accountId,
      req.query.users === 'true' ? true : false
    );
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
