document.addEventListener("DOMContentLoaded", function () {
    // === Menu latéral responsive ===
    const menu = document.getElementById("menu");
    const menuToggle = document.getElementById("menuToggle");

    if (menu && menuToggle) {
        menuToggle.addEventListener("click", function () {
            if (menu.classList.contains("open")) {
                menu.classList.remove("open");
                menu.style.left = "-250px";
            } else {
                menu.classList.add("open");
                menu.style.left = "0";
            }
        });
    } else {
        console.error("Erreur : menu ou bouton menuToggle non trouvé");
    }

    // === Interface init ===
    const gmBtn = document.getElementById("gmButton");
    const connectBtn = document.getElementById("connectButton");
    const gmCountSpan = document.getElementById("gmCount");
    const gmCountDiv = document.getElementById("gmCountContainer");
    const messageDiv = document.getElementById("message");

    gmBtn.disabled = true;
    gmBtn.style.opacity = "0.6";
    gmCountDiv.style.display = "none";
    messageDiv.innerText = "Connect your wallet before";
    messageDiv.style.display = "block";
    messageDiv.style.color = "white";

    let walletAddress = null;
    let signer = null;

    // === CONNECT WALLET ===
    async function toggleWallet() {
        if (!window.ethereum) {
            alert("No wallet detected");
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            walletAddress = await signer.getAddress();

            connectBtn.innerText = walletAddress.slice(0, 4) + "..." + walletAddress.slice(-4);
            connectBtn.setAttribute("data-connected", "true");
            gmBtn.disabled = false;
            gmBtn.style.opacity = "";
            messageDiv.style.display = "none";

            updateGMCount();
        } catch (error) {
            console.error("Wallet connection failed:", error);
            alert("Wallet connection failed! Check the console for details.");
        }
    }

    function disconnectWallet() {
        connectBtn.innerText = "Connect Wallet";
        connectBtn.setAttribute("data-connected", "false");
        walletAddress = null;
        signer = null;
        gmBtn.disabled = true;
        gmBtn.style.opacity = "0.6";
        gmCountDiv.style.display = "none";
        messageDiv.innerText = "Connect your wallet before";
        messageDiv.style.display = "block";
        gmCountSpan.innerText = "0";
    }

    connectBtn.addEventListener("click", function () {
        if (this.getAttribute("data-connected") === "true") {
            disconnectWallet();
        } else {
            toggleWallet();
        }
    });

    // === CONTRACT UTILITY ===
    const CONTRACT_ADDRESS = "0x5FA44e0B159E519F8cd20a22CCED03317602BBEC";

    const abi = [
        "function sayGM() external",
        "function getGMCount(address user) view returns (uint256)",
    ];

    function getContract() {
        if (!signer) throw new Error("Signer required");
        return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    }

    // === AUTO SWITCH NETWORK IF NOT Optimism ===
    async function ensureOnOptimism() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();

        if (Number(network.chainId) !== 10) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xa' }] // 10 = Optimism
                });
                return true;
            } catch (error) {
                messageDiv.innerText = "Please switch to Optimism!";
                messageDiv.style.display = "block";
                gmBtn.disabled = true;
                return false;
            }
        }
        return true;
    }

    // === GM BUTTON HANDLER ===
    async function sendGM() {
        gmBtn.innerText = "Sending...";
        messageDiv.innerText = '';
        if (!(await ensureOnOptimism())) {
            gmBtn.innerText = "GM";
            return;
        }

        try {
            const contract = getContract();
            const tx = await contract.sayGM();
            messageDiv.innerText = "Transaction pending...";
            await tx.wait();

            messageDiv.innerText = "GM sent! ✨";
            gmBtn.disabled = false;
            updateGMCount();
        } catch (err) {
            messageDiv.innerText = "Error sending GM!";
            console.error(err);
        } finally {
            gmBtn.innerText = "GM";
        }
    }

    gmBtn.addEventListener("click", sendGM);

    // === GM COUNT DISPLAY ===
    async function updateGMCount() {
        if (!walletAddress) return;
        try {
            const contract = getContract();
            const gmCount = await contract.getGMCount(walletAddress);
            gmCountSpan.innerText = gmCount.toString();
            gmCountDiv.style.display = "block";
        } catch (error) {
            console.error("Error retrieving GM count:", error);
        }
    }
});