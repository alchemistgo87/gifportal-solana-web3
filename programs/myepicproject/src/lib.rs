use anchor_lang::prelude::*;

declare_id!("BPHVCgjXf5cvyurW2EPJH46cZKxqJvYBi4fi8b1RBByz");

#[program]
pub mod myepicproject {
  use super::*;
  pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;
    base_account.total_gifs = 0;
    Ok(())
  }
	 
  // The fucntion now accepts a gif_link param from the user.
  pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;
		
	// Build the struct.
    let item = ItemStruct {
      gif_link: gif_link.to_string(),
      user_address: *ctx.accounts.user.to_account_info().key,
      votes: 0,
    };
		
	// Add it to the gif_list vector.
    base_account.gif_list.push(item);
    base_account.total_gifs += 1;
    Ok(())
  }

  // pub fn update_item(ctx: Context<UpdateItem>, index: usize, gif_link: String) -> ProgramResult {
  //   let base_account = &mut ctx.accounts.base_account;
  //   base_account.gif_list[index].gif_link = gif_link.to_string();
  //   Ok(())
  // }

  // Update GIF (Part of extra feature)

  pub fn update_item(ctx: Context<UpdateItem>, index: u64, vote: Vote) -> Result<()> {
    let base_account = &mut ctx.accounts.base_account;
    quotes_gif_internals::do_vote(base_account, index as usize, vote)
  }

  pub fn up_vote(ctx: Context<UpdateItem>, index: u64) -> Result<()> {
    let base_account = &mut ctx.accounts.base_account;
    quotes_gif_internals::do_vote(base_account, index as usize, Vote::Up)
  }

  pub fn down_vote(ctx: Context<UpdateItem>, index: u64) -> Result<()> {
    let base_account = &mut ctx.accounts.base_account;
    quotes_gif_internals::do_vote(base_account, index as usize, Vote::Down)
  }
}

#[derive(Accounts)]
pub struct StartStuffOff<'info> {
  #[account(init, payer = user, space = 9000)]
  pub base_account: Account<'info, BaseAccount>,
  #[account(mut)]
  pub user: Signer<'info>,
  pub system_program: Program <'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>,
  #[account(mut)]
  pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateItem<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>,
  #[account(mut)]
  pub user: Signer<'info>,
}

// Create a custom struct for us to work with.
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
    // Part of extra feature
    pub votes: i64,
}

#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
	// Attach a Vector of type ItemStruct to the account.
    pub gif_list: Vec<ItemStruct>,
}


// Adding Extra Features

mod quotes_gif_internals {
  use super::*;

  pub fn do_vote(base_account: &mut Account<BaseAccount>, index: usize, vote: Vote) -> Result<()> {
    if index < base_account.gif_list.len() {
      let mut item = &mut base_account.gif_list[index];
      item.votes += vote as i64;
      Ok(())
    }
    else {
      Err(ErrorCode::GifIndexOutOfBounds.into())
    }
  }
}



#[error]
pub enum ErrorCode {
    #[msg("No GIF at this index")]
    GifIndexOutOfBounds,
}

#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum Vote {
  Down = -1,
  Up   =  1,
}

