import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';
import { expect } from 'chai';

describe('compliant-registry (accredit)', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CompliantRegistry;
  const authority = provider.wallet;

  it('derives pool registry PDA', async () => {
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool_registry'), authority.publicKey.toBuffer()],
      program.programId
    );

    expect(registryPda).to.not.be.null;
    expect(program.programId).to.not.be.null;
  });

  it('derives pool entry PDA', async () => {
    const ammKey = Keypair.generate().publicKey;
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool_registry'), authority.publicKey.toBuffer()],
      program.programId
    );

    const [poolEntryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool_entry'), registryPda.toBuffer(), ammKey.toBuffer()],
      program.programId
    );

    expect(poolEntryPda).to.not.be.null;
  });

  it('derives compliance config PDA', async () => {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('compliance_config'), authority.publicKey.toBuffer()],
      program.programId
    );

    expect(configPda).to.not.be.null;
  });
});
