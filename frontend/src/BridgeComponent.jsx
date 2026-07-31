import { useState, useEffect } from "react";
import { ethers } from "ethers";

// 🔥 Import the ABI from your compiled Hardhat contract
import SimpleVaultArtifact from "../../artifacts/contracts/SimpleVault.sol/SimpleVault.json";

// ⚠️ UPDATE THIS with your deployed contract address
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function BridgeComponent() {
  // ============================================================
  // 1. ALL STATE DECLARED FIRST (Order matters!)
  // ============================================================
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState("0");
  const [vaultBalance, setVaultBalance] = useState("0");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  // ============================================================
  // 2. FETCH BALANCES (Utility function)
  // ============================================================
  const fetchBalances = async (providerInstance, address, contractInstance) => {
    try {
      // Native ETH balance of the user
      const ethBalance = await providerInstance.getBalance(address);
      setBalance(ethers.formatEther(ethBalance));

      // User's balance inside the Vault (Bridge)
      const vaultBal = await contractInstance.balances(address);
      setVaultBalance(ethers.formatEther(vaultBal));
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  // ============================================================
  // 3. REFRESH BALANCES (Wrapper)
  // ============================================================
  const refreshBalances = async () => {
    if (provider && account && contract) {
      await fetchBalances(provider, account, contract);
    }
  };

  // ============================================================
  // 4. CONNECT WALLET
  // ============================================================
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      setIsLoading(true);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      const userAddress = await signer.getAddress();

      const bridgeContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SimpleVaultArtifact.abi,
        signer
      );

      setProvider(browserProvider);
      setAccount(userAddress);
      setContract(bridgeContract);

      await fetchBalances(browserProvider, userAddress, bridgeContract);

      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          window.location.reload();
        }
      });

      setTxStatus("✅ Wallet connected successfully!");
    } catch (error) {
      console.error(error);
      setTxStatus(`❌ Connection failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // 5. DISCONNECT
  // ============================================================
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    setBalance("0");
    setVaultBalance("0");
    setTxStatus("👋 Disconnected");
  };

  // ============================================================
  // 6. BRIDGE ACTIONS
  // ============================================================
  const handleDeposit = async () => {
    if (!contract || !amount) return;
    setIsLoading(true);
    setTxStatus("⏳ Processing deposit...");

    try {
      const tx = await contract.deposit({
        value: ethers.parseEther(amount),
        gasLimit: 100000,
      });
      await tx.wait();
      setTxStatus(`✅ Deposited ${amount} ETH! Tx: ${tx.hash.slice(0, 10)}...`);
      await refreshBalances();
      setAmount("");
    } catch (error) {
      console.error(error);
      setTxStatus(`❌ Deposit failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !amount) return;
    setIsLoading(true);
    setTxStatus("⏳ Processing withdrawal...");

    try {
      const tx = await contract.withdraw(ethers.parseEther(amount), {
        gasLimit: 100000,
      });
      await tx.wait();
      setTxStatus(`✅ Withdrew ${amount} ETH! Tx: ${tx.hash.slice(0, 10)}...`);
      await refreshBalances();
      setAmount("");
    } catch (error) {
      console.error(error);
      setTxStatus(`❌ Withdraw failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // 7. useEffect HOOK - RUNS AFTER EVERYTHING IS DEFINED
  // ============================================================
  useEffect(() => {
    if (provider && account && contract) {
      const interval = setInterval(() => {
        refreshBalances();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [provider, account, contract]); // Re-run when these change

  // ============================================================
  // 8. UI RENDER
  // ============================================================
  return (
    <div style={styles.container}>
      <h1>🌉 Cross-Chain Bridge (Mock)</h1>
      <h3>Proj-04: Vault Bridge</h3>

      {!account ? (
        <button onClick={connectWallet} style={styles.button} disabled={isLoading}>
          {isLoading ? "Connecting..." : "🦊 Connect MetaMask"}
        </button>
      ) : (
        <div style={styles.card}>
          <p>
            <strong>Account:</strong> {account.slice(0, 6)}...{account.slice(-4)}
          </p>
          <p>
            <strong>Wallet Balance:</strong> {balance} ETH
          </p>
          <p>
            <strong>Vault (Bridge) Balance:</strong> {vaultBalance} ETH
          </p>

          <hr style={styles.divider} />

          <div style={styles.inputGroup}>
            <label>Amount (ETH):</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div style={styles.actionGroup}>
            <button
              onClick={handleDeposit}
              style={{ ...styles.button, backgroundColor: "#28a745" }}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              🔒 Lock / Deposit
            </button>
            <button
              onClick={handleWithdraw}
              style={{ ...styles.button, backgroundColor: "#dc3545" }}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              🔓 Release / Withdraw
            </button>
          </div>

          <button
            onClick={refreshBalances}
            style={{ ...styles.button, backgroundColor: "#6c757d", width: "auto" }}
          >
            🔄 Refresh Balances
          </button>

          <button
            onClick={disconnectWallet}
            style={{ ...styles.button, backgroundColor: "#343a40", width: "auto" }}
          >
            🚪 Disconnect
          </button>

          <p style={styles.status}>{txStatus}</p>
        </div>
      )}
    </div>
  );
}

// -------- STYLES (Inline for simplicity) --------
const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    color: "#212529", // ⬅️ FIXED: Dark text for all text inside container
  },
  card: {
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "8px",
    marginTop: "20px",
    color: "#212529", // ⬅️ FIXED: Dark text inside the card
  },
  inputGroup: {
    margin: "15px 0",
  },
  input: {
    padding: "10px",
    width: "200px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginLeft: "10px",
    color: "#212529", // ⬅️ FIXED: Dark text inside input
    backgroundColor: "#ffffff", // ⬅️ FIXED: White background for input
  },
  actionGroup: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginTop: "15px",
    flexWrap: "wrap",
  },
  button: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    color: "white", // Button text stays white (background is colored)
    cursor: "pointer",
    margin: "5px",
    backgroundColor: "#007bff",
    transition: "opacity 0.2s",
  },
  status: {
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#e9ecef",
    borderRadius: "4px",
    color: "#212529", // ⬅️ FIXED: Dark text for status messages
    wordBreak: "break-all",
  },
  divider: {
    margin: "20px 0",
    border: "0",
    borderTop: "1px solid #dee2e6",
  },
};