import Vuex from 'vuex'
//import actions from './actions'
import mutations from './mutations'
//import getters from './getters'
import {COIN_NAME} from "~/assets/variables";

export default function createStore () {
    return new Vuex.Store({
        state: {
            COIN_NAME,
        },
        //actions,
        mutations,
        //getters,
    })
}
