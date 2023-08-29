import React, { useState } from "react";
import { authenticateCeramic } from '../utils'
import {useCeramicContext} from "../context";

const AuthPrompt = () => {
    const [isVisible, setIsVisible] = useState(true);
    const clients = useCeramicContext()
    const { ceramic, composeClient } = clients
    const isLogged = () => {
        return localStorage.getItem("logged_in") == "true"
    };

    const handleOpen = () => {
        if(localStorage.getItem("logged_in")){
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const handleKeyDid = () => {
        localStorage.setItem("ceramic:auth_type", "key");
        setIsVisible(false);
        authenticateCeramic(ceramic, composeClient)
    };

    const handleEthPkh = () => {
        localStorage.setItem("ceramic:auth_type", "eth");
        setIsVisible(false);
        authenticateCeramic(ceramic, composeClient)
    };

    return (
        <div>
            {
                isVisible && (
                <div className="popup">
                    <div className="popup-content">
                        <h2>Authenticate</h2>
                        <span><button onClick={handleKeyDid}>Key DID</button></span>
                        <span><button onClick={handleEthPkh}>Ethereum DID PKH</button></span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPrompt;