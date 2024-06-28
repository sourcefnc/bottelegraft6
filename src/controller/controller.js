import axios from "axios";

export const getDataFlexible = async (userId) => {
    try {
        let response = await axios.get(`http://localhost:3008/api/data-flexible?userId=${userId}`)
        let dataUser = response.data;
        if (dataUser === 'Not User') {
            return false;
        }
        return {
            totalAssets: dataUser.capitalSatisfaction + dataUser.unwithdrawnProfits + dataUser.capitalAwaitingApproval,
            trueAssets: dataUser.capitalSatisfaction,
            falseAssets: dataUser.capitalAwaitingApproval,
            unWithdrawn: dataUser.unwithdrawnProfits,
            withdrawn: dataUser.profitWithdrawn
        }
    } catch (error) {

    }

}

export const reqWithdrawnFlexible = async (quantity, userId) => {
    let response = await axios.post('http://localhost:3008/api/withdrawn-flexible', {
        quantity,
        userId
    })
    return response;
}

