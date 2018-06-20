# levels in infinity mode

class Api::InfinityController < ApplicationController
  before_action :set_user

  def solved_puzzle
    if @user
      @user.completed_infinity_puzzles.find_or_create_by(puzzle_params)
      # attempt = @user.level_attempts.find_or_create_by(level_id: params[:id])
      # attempt.update_attribute :last_attempt_at, Time.now
      # attempt.completed_rounds.create(round_params)
    end
    render json: {}
  end

  private

  def puzzle_params
    params.require(:puzzle).permit(:difficulty, :puzzle_id)
  end

  def set_user
    @user = current_user
  end
end
