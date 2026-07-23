import Link from "next/link";
import { toggleFavoriteAction } from "../actions";

type FavoriteButtonProps = {
  authenticated: boolean;
  isFavorite: boolean;
  listingId: string;
};

export function FavoriteButton({
  authenticated,
  isFavorite,
  listingId,
}: FavoriteButtonProps) {
  if (!authenticated) {
    return (
      <Link className="favorite-button" href="/auth/log-ind">
        <span aria-hidden="true">♡</span>
        Log ind for at gemme
      </Link>
    );
  }

  return (
    <form action={toggleFavoriteAction.bind(null, listingId)}>
      <button
        aria-pressed={isFavorite}
        className={`favorite-button${isFavorite ? " favorite-button--active" : ""}`}
        type="submit"
      >
        <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
        {isFavorite ? "Gemt som favorit" : "Gem som favorit"}
      </button>
    </form>
  );
}
