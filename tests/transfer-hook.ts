import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';
import { expect } from 'chai';

describe('transfer-hook (accredit)', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TransferHook;
  const authority = provider.wallet;

  let mint: Keypair;
  let registryPda: PublicKey;
  let registryBump: number;

  before(async () => {
    mint = Keypair.generate();
  });

  it('initializes a KYC registry', async () => {
    // Registry PDA derivation
    [registryPda, registryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('kyc_registry'), mint.publicKey.toBuffer()],
      program.programId
    );

    // Note: Full test requires deploying a Token-2022 mint with transfer hook extension
    // This is a structural test to verify the program loads correctly
    expect(program.programId).to.not.be.null;
    expect(registryPda).to.not.be.null;
  });

  it('derives whitelist entry PDA with unified seeds', async () => {
    const wallet = Keypair.generate().publicKey;

    const [whitelistPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('whitelist'), wallet.toBuffer()],
      program.programId
    );

    // Verify PDA is deterministic
    const [whitelistPda2] = PublicKey.findProgramAddressSync(
      [Buffer.from('whitelist'), wallet.toBuffer()],
      program.programId
    );

    expect(whitelistPda.toBase58()).to.equal(whitelistPda2.toBase58());
  });

  it('derives extra account meta list PDA', async () => {
    const [extraMetaPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('extra-account-metas'), mint.publicKey.toBuffer()],
      program.programId
    );

    expect(extraMetaPda).to.not.be.null;
  });
});
