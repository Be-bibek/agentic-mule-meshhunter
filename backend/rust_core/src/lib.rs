use pyo3::prelude::*;
use serde::Deserialize;
use std::fs;

// Simple struct to parse exactly what we need from the JSON
#[derive(Deserialize, Debug)]
struct DeviceInfo {
    device_id: String,
    ip_address: String,
    user_agent: String,
}

#[derive(Deserialize, Debug)]
struct Transaction {
    transaction_id: String,
    sender_id: String,
    receiver_id: String,
    amount: f64,
    timestamp: String,
    device_info: DeviceInfo,
}

#[derive(Deserialize, Debug)]
struct Account {
    account_id: String,
    name: String,
    created_at: String,
}

#[pyclass]
pub struct EdgeList {
    #[pyo3(get)]
    pub user_to_user: Vec<(String, String, String, f64, String, String)>, // (sender, receiver, txn_id, amount, timestamp, device_id)
    #[pyo3(get)]
    pub user_to_device: Vec<(String, String)>, // (sender, device_id)
    #[pyo3(get)]
    pub devices: Vec<(String, String, String)>, // (device_id, ip, user_agent)
}

#[pyfunction]
fn parse_transactions(filepath: String) -> PyResult<EdgeList> {
    // Read the file directly in Rust for speed
    let content = fs::read_to_string(&filepath)?;
    let transactions: Vec<Transaction> = serde_json::from_str(&content).map_err(|e| {
        pyo3::exceptions::PyValueError::new_err(format!("Failed to parse JSON: {}", e))
    })?;

    let mut user_to_user = Vec::new();
    let mut user_to_device = Vec::new();
    let mut devices = Vec::new();

    for txn in transactions {
        // Edge between users
        user_to_user.push((
            txn.sender_id.clone(),
            txn.receiver_id.clone(),
            txn.transaction_id,
            txn.amount,
            txn.timestamp,
            txn.device_info.device_id.clone(),
        ));

        // Edge linking user to the device they used
        user_to_device.push((
            txn.sender_id.clone(),
            txn.device_info.device_id.clone(),
        ));

        // Device attributes (can be deduplicated in Python or here, we just pass it)
        devices.push((
            txn.device_info.device_id,
            txn.device_info.ip_address,
            txn.device_info.user_agent,
        ));
    }

    Ok(EdgeList {
        user_to_user,
        user_to_device,
        devices,
    })
}

#[pymodule]
fn rust_core(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(parse_transactions, m)?)?;
    m.add_class::<EdgeList>()?;
    Ok(())
}
